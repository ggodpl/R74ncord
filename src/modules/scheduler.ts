import { Base } from '../base';
import { CronJob } from 'cron';
import { Bot } from '../bot';
import { randomUUID } from 'crypto';
import { Task } from '../tasks/task';
import { TaskRegistry } from '../tasks/registry';
import { Logger } from '../logger';
import { promises as fs } from 'fs';
import path from 'path';

interface Job<T> {
    task: string;
    context: T;
    after: number;
    scheduledAt: number;
    tainted?: boolean;
}

export class Scheduler extends Base {
    jobs: Map<string, Job<any>>;
    exec!: CronJob;
    pers: NodeJS.Timeout | undefined;

    private readonly storagePath = path.join(process.cwd(), 'data', 'scheduler-jobs.json');

    constructor (bot: Bot) {
        super(bot);

        this.jobs = new Map();

        this.loadJobs().finally(() => {
            this.exec = new CronJob('*/10 * * * * *', this.dispatchTasks.bind(this), null, true);
        });
    }

    schedule<T>(task: Task<T>, after: number) {
        const id = randomUUID();
        const job = {
            task: task.TASK_ID,
            context: task.context,
            after,
            scheduledAt: Date.now(),
            tainted: false,
        }
        this.jobs.set(id, job);
        this.debouncedPersist();
        return id;
    }

    unschedule(jobId: string) {
        this.jobs.delete(jobId);
        this.debouncedPersist();
    }

    async dispatchTasks() {
        const now = Date.now();
        for (const [id, job] of [...this.jobs.entries()]) {
            if (job.scheduledAt + job.after <= now) {
                const TaskCtor = TaskRegistry.get(job.task);

                if (!TaskCtor) {
                    this.unschedule(id);
                    continue;
                }

                try {
                    const instance = new TaskCtor(job.context);
                    await instance.handle(this.bot);

                    this.unschedule(id);
                } catch (err) {
                    Logger.error(`Task "${job.task}" failed`, 'scheduler');
                    console.error(err);
                    if (job.tainted) {
                        this.unschedule(id);
                    } else {
                        job.tainted = true;
                        this.debouncedPersist();
                    }
                }
            }
        }
    }

    private async loadJobs() {
        try {
            const raw = await fs.readFile(this.storagePath, 'utf-8');
            const parsed = JSON.parse(raw);

            this.jobs = new Map(parsed);
        } catch {
            this.jobs = new Map();
        }
    }

    private debouncedPersist() {
        if (this.pers) clearTimeout(this.pers);
        this.pers = setTimeout(() => {
            void this.persist().catch((err) => {
                Logger.error(`Failed to persist scheduler jobs: ${String(err)}`, 'scheduler');
            });
        }, 200);
    }

    private async persist() {
        const dir = path.dirname(this.storagePath);
        await fs.mkdir(dir, { recursive: true });

        const payload = JSON.stringify([...this.jobs.entries()], null, 2);
        const tmp = `${this.storagePath}.tmp`;

        await fs.writeFile(tmp, payload, 'utf-8');
        await fs.rename(tmp, this.storagePath);
    }
}