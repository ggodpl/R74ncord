import { GuildTextBasedChannel, Message } from 'discord.js';
import { Base, Messagable } from '../base';
import { Bot } from '../bot';
import { CronJob } from 'cron';
import { Logger } from '../logger';

export class ScamDetection extends Base implements Messagable<true> {
    private messages: Map<string, { messages: { id: string, channelId: string }[], expiresAt: number }>;
    private exec: CronJob;

    constructor (bot: Bot) {
        super(bot);

        this.messages = new Map();
        this.exec = new CronJob('*/2 * * * * *', this.cleanup.bind(this), null, true);
    }

    async onMessage(message: Message<true>) {
        if (message.author.bot) return;
        if (!message.guild) return;

        const key = `${message.author.id}_${message.guild.id}`

        if (!this.messages.has(key)) this.messages.set(key, { messages: [], expiresAt: Date.now() + 2000 });
        const messages = this.messages.get(key)!;

        if (messages.messages.some(m => m.channelId == message.channelId)) return;

        messages.messages.push({ id: message.id, channelId: message.channelId });
        messages.expiresAt = Date.now() + 2000;

        if (messages.messages.length >= 4) {
            await this.blockPotentialScam(message.author.id, message.guildId);
        }
    }

    cleanup() {
        this.messages.forEach((m, k) => {
            if (m.expiresAt < Date.now()) this.messages.delete(k);
        });
    }

    async blockPotentialScam(userId: string, guildId: string) {
        const guild = this.bot.client.guilds.cache.get(guildId);
        if (!guild) return;
        
        const key = `${userId}_${guildId}`
        const messages = this.messages.get(key);
        if (!messages) return;

        this.messages.delete(key);

        try {
            const member = await guild.members.fetch(userId);

            if (!member.moderatable) return;
    
            for (const message of messages.messages) {
                const channel = await guild.channels.fetch(message.channelId) as GuildTextBasedChannel;
                if (!channel) continue;
    
                try {
                    const msg = await channel.messages.fetch(message.id);
                    await msg.delete();
                // no need to do anything if the message doesnt even exist
                } catch {};
            }
    
            try {
                await member.timeout(24 * 60 * 60 * 1000, 'Scam detection. You are sending messages too quickly! If this is a mistake or you got your account back, appeal this timeout.');
            } catch (err) {
                Logger.error('Failed to timeout: ' + err, 'SCAM DETECTION');
            }
        } catch (err) {
            Logger.error('Failed to fetch: ' + err, 'SCAM DETECTION');
        }
    }
}