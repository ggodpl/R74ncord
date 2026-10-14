import { AttachmentBuilder, ChatInputCommandInteraction, Colors, EmbedBuilder, SlashCommandBooleanOption } from 'discord.js';
import { Command, CommandPermissionLevel } from '../../command';
import { Bot } from '../../../bot';
import Zombie_InfectedUsers from '../../../mongodb/models/serverEvents/Zombie_InfectedUsers';
import { ChartConfiguration } from 'chart.js';
import { renderChart } from '../../../utils/chart';
import { getFooter } from '../../../utils/embed';
import { formatDuration } from '../../../utils/date';

type Zombie_InfectedUser = { userId: string; infectedBy: string; infectedSince: Date };

class StatsZombieEvent extends Command {
    private static TOP_ZOMBIES: number = 15;

    constructor () {
        super({
            name: 'zombie',
            description: 'Zombie event report',
            permissionLevel: CommandPermissionLevel.MOD,
            options: [
                new SlashCommandBooleanOption()
                    .setName('raw-data')
                    .setDescription('Whether to send the report in raw JSON')
                    .setRequired(false),
            ],
            dm: false,
        })
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        if (!command.inGuild()) return command.editReply({
            content: 'This command can only be used in a guild',
        });
        const rawData = command.options.getBoolean('raw-data', false) ?? false;
    
        const allUsers = await Zombie_InfectedUsers.find({
            guildId: command.guildId,
        }).lean();

        if (allUsers.length === 0) return command.editReply({
            content: 'No infection data for this server yet.',
        });

        const zombies = allUsers.reduce((acc: Record<string, number>, i) => (acc[i.infectedBy] = (acc[i.infectedBy] ?? 0) + 1, acc), {});
        const dailyInfections = allUsers.reduce((acc: Record<string, number>, i) => {
            const d = i.infectedSince.toISOString().slice(0, 10);
            acc[d] = (acc[d] ?? 0) + 1;
            return acc;
        }, {});

        const days = Object.keys(dailyInfections).sort();
        if (days.length === 0) return command.editReply({
            content: 'No infection data for this server yet.',
        });

        const timeline: string[] = [];
        const end = new Date(days.at(-1)!);
        for (const d = new Date(days[0]); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
            timeline.push(d.toISOString().slice(0, 10));
        }
        const daily = timeline.map(d => dailyInfections[d] ?? 0);
        const dailyMapped = timeline.map(d => [d, dailyInfections[d] ?? 0] as const);

        const dailyInfectionsCumulative: Record<string, number> = {};

        let total = 0;
        for (const d of timeline) {
            total += dailyInfections[d] ?? 0;
            dailyInfectionsCumulative[d] = total;
        }

        if (rawData) {
            const attachments = [
                new AttachmentBuilder(Buffer.from(JSON.stringify(zombies))).setName('zombies.json'),
                new AttachmentBuilder(Buffer.from(JSON.stringify(dailyInfections))).setName('infection-timeline.json'),
                new AttachmentBuilder(Buffer.from(JSON.stringify(dailyInfectionsCumulative))).setName('infection-timeline-cumulative.json'),
                new AttachmentBuilder(Buffer.from(JSON.stringify(allUsers))).setName('raw.json')
            ];

            return command.editReply({
                files: attachments,
            });
        }

        const topZombies = Object.entries(zombies)
            .sort((a, b) => b[1] - a[1])
            .slice(0, StatsZombieEvent.TOP_ZOMBIES);
        
        const zombiesNames = await Promise.all(topZombies.map(async ([id]) => {
            const user = await bot.client.users.fetch(id).catch(() => null);

            return user?.username ?? id;
        }));

        const stats = this.analyzeOutbreak(allUsers);

        const zombiesConfig: ChartConfiguration<'bar'> = {
            type: 'bar',
            data: {
                labels: zombiesNames,
                datasets: [{
                    label: 'Infections',
                    data: topZombies.map(([, count]) => count),
                    backgroundColor: '#57f287',
                }],
            },
            options: {
                indexAxis: 'y',
                plugins: {
                    title: { display: true, text: `Top ${StatsZombieEvent.TOP_ZOMBIES} zombies` },
                    legend: { display: false },
                },
                scales: {
                    x: { beginAtZero: true, ticks: { precision: 0 } },
                },
            },
        };

        const timelineConfig: ChartConfiguration<'bar' | 'line', number[], string> = {
            type: 'bar',
            data: {
                labels: timeline,
                datasets: [
                    {
                        type: 'bar',
                        label: 'New infections',
                        data: daily,
                        backgroundColor: '#ed4245',
                        yAxisID: 'y',
                    },
                    {
                        type: 'line',
                        label: 'Total infected',
                        data: Object.values(dailyInfectionsCumulative),
                        borderColor: '#57f287',
                        backgroundColor: '#57f287',
                        pointRadius: 0,
                        tension: 0.2,
                        yAxisID: 'y1',
                    },
                ],
            },
            options: {
                plugins: {
                    title: { display: true, text: 'Infection timeline' },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        position: 'left',
                        ticks: { precision: 0 },
                        title: { display: true, text: 'New per day' },
                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        ticks: { precision: 0 },
                        grid: { drawOnChartArea: false },
                        title: { display: true, text: 'Total' },
                    },
                },
            },
        };

        const hourConfig: ChartConfiguration<'bar'> = {
            type: 'bar',
            data: {
                labels: stats.byHour.map((_, h) => `${String(h).padStart(2, '0')}:00`),
                datasets: [{
                    label: 'Infections',
                    data: stats.byHour,
                    backgroundColor: '#fee75c',
                }],
            },
            options: {
                plugins: {
                    title: { display: true, text: 'Infections by hour of day (UTC-5)' }, legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 } }
                },
            },
        };

        const generationConfig: ChartConfiguration<'bar'> = {
            type: 'bar',
            data: {
                labels: stats.perGeneration.map((_, i) => `Gen ${i + 1}`),
                datasets: [{
                    label: 'Infected',
                    data: stats.perGeneration,
                    backgroundColor: '#eb459e'
                }],
            },
            options: {
                plugins: {
                    title: { display: true, text: 'Infections per generation' }, legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 } }
                },
            }
        }

        const [zombiesPng, timelinePng, hourPng, generationPng] = await Promise.all([
            renderChart(zombiesConfig, 1200, Math.max(400, topZombies.length * 40 + 120)),
            renderChart(timelineConfig),
            renderChart(hourConfig),
            renderChart(generationConfig),
        ]);
        
        const mostInfections = dailyMapped.sort((a, b) => b[1] - a[1])[0];
        const leastInfections = dailyMapped.sort((a, b) => a[1] - b[1])[0];

        const embed = new EmbedBuilder()
            .setTitle('Incident report')
            .setDescription(`**${allUsers.length}** users were infected over the period of ${timeline.length} days.\n${mostInfections[0]} saw the most infections with ${mostInfections[1]} infections\n${leastInfections[0]} was the most peaceful with ${leastInfections[1]} infections\nR₀: ${stats.r0.toFixed(2)}\nLongest chain: ${stats.maxGeneration} generations\nBiggest outbreaks: ${stats.topOutbreaks.map(([id, n], i) => `${i + 1}. <@${id}> — ${n} descendants`).join('\n') || 'None'}\n${stats.fastestTurn ? `Fastest turn: <@${stats.fastestTurn.userId}> in ${formatDuration(stats.fastestTurn.ms)} (median ${formatDuration(stats.medianTurnMs!)})` : 'N/A'}\nDead ends: ${stats.deadEnds} (${Math.round(stats.deadEnds / allUsers.length * 100)}%) never infected anyone\nSuccessful zombies had an average of ${stats.averageInfectionsPerSpreader.toFixed(2)} infections`)
            .setColor(Colors.Red)
            .setFooter(getFooter());

        return command.editReply({
            embeds: [embed],
            files: [
                new AttachmentBuilder(zombiesPng).setName('zombies.png'),
                new AttachmentBuilder(timelinePng).setName('timeline.png'),
                new AttachmentBuilder(hourPng).setName('by-hour.png'),
                new AttachmentBuilder(generationPng).setName('generations.png'),
            ],
        });
    }

    analyzeOutbreak(users: Zombie_InfectedUser[]) {
        const infected = new Map(users.map(u => [u.userId, u]));
        const children = new Map<string, string[]>();

        for (const u of users) {
            const list = children.get(u.infectedBy) ?? [];
            list.push(u.userId);
            children.set(u.infectedBy, list);
        }

        const patientZero = [...infected.values()].find(i => i.infectedBy === '0')!;

        const generation = new Map<string, number>();
        const queue: [string, number][] = [[patientZero.userId, 0]];
        while (queue.length) {
            const [id, gen] = queue.shift()!;
            if (generation.has(id)) continue;
            generation.set(id, gen);
            for (const c of children.get(id) ?? []) {
                queue.push([c, gen + 1]);
            }
        }

        const descendants = new Map<string, number>();
        for (const [id] of [...generation].sort((a, b) => b[1] - a[1])) {
            let n = 0;
            for (const c of children.get(id) ?? []) n += 1 + (descendants.get(c) ?? 0);
            descendants.set(id, n);
        }

        const perGeneration: number[] = [];
        for (const [id, gen] of generation) {
            if (gen === 0) continue;
            perGeneration[gen - 1] = (perGeneration[gen - 1] ?? 0) + 1;
        }

        const totalSecondaryInfections = users.reduce((acc, u) => acc + (children.get(u.userId)?.length ?? 0), 0);
        const spreaders = users.filter(u => (children.get(u.userId)?.length ?? 0) > 0);
        const r0 = totalSecondaryInfections / (users.length - 1);
        const averageInfectionsPerSpreader = totalSecondaryInfections / spreaders.length;

        const deadEnds = users.filter(u => !children.has(u.userId)).length;

        const turnTimes = users
            .filter(u => children.has(u.userId))
            .map(u => {
                const first = Math.min(...children.get(u.userId)!.map(c => infected.get(c)!.infectedSince.getTime()));
                return { userId: u.userId, ms: first - u.infectedSince.getTime() }
            })
            .filter(t => t.ms >= 0)
            .sort((a, b) => a.ms - b.ms);
        
        const medianTurnMs = turnTimes.length ? turnTimes[Math.floor(turnTimes.length / 2)].ms : null;

        const hourFmt = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: '-05:00' });
        const byHour = Array<number>(24).fill(0);
        for (const u of users) byHour[Number(hourFmt.format(u.infectedSince))]++;

        const topOutbreaks = [...descendants]
            .filter(([, n]) => n > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        return {
            patientZero,
            perGeneration,
            maxGeneration: perGeneration.length,
            r0,
            deadEnds,
            fastestTurn: turnTimes[0] ?? null,
            medianTurnMs,
            byHour,
            topOutbreaks,
            averageInfectionsPerSpreader,
        };
    }
}

export default class StatsEvent extends Command {
    constructor () {
        super({
            name: 'stats-event',
            description: 'Event report',
            permissionLevel: CommandPermissionLevel.MOD,
            subcommands: [
                new StatsZombieEvent(),
            ],
            dm: false,
        });
    }

    execute() {}
}