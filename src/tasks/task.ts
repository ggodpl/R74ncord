import { Bot } from '../bot';

export abstract class Task<T extends Record<string, any>> {
    static readonly TASK_ID: string;

    context: T;
    constructor (context: T) {
        this.context = context;
    }

    get TASK_ID() {
        return (this.constructor as typeof Task).TASK_ID;
    }

    abstract handle(bot: Bot): void | Promise<void>;
}