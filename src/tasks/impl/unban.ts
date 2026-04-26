import { Bot } from '../../bot';
import { Task } from '../task';

export default class UnbanTask extends Task<{
    userId: string,
    guildId: string,
}> {
    static override readonly TASK_ID = 'unban_task';

    async handle(bot: Bot): Promise<void> {
        const guild = bot.client.guilds.cache.get(this.context.guildId);
        if (!guild) return;

        await guild.bans.remove(this.context.userId, 'Ban expired');
    }
}