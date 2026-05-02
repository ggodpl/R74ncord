import { Attachment, ForumChannel, ForumThreadChannel, Message, MessageCreateOptions, MessagePayload, User, Webhook, WebhookType } from 'discord.js';
import { Base } from '../../base';
import { Logger } from '../../logger';
export class TicketTransport extends Base {
    private hooks: Map<string, Webhook> = new Map();

    async sendMessageUser(userId: string, message: MessagePayload | MessageCreateOptions | string) {
        const user = await this.bot.client.users.fetch(userId);

        if (user) {
            try {
                await user.send(message);
                return true;
            } catch {
                Logger.warn('Could not DM user ' + userId);
                // probably user dms are closed, bot is blocked, no mutual servers
                // technically invalid message is caught by this too, but hopefully no invalid messages get into this function anyway 
                return false;
            }
        }

        return false;
    }

    private async getChannelWebhook(channel: ForumChannel) {
        if (this.hooks.has(channel.id)) return this.hooks.get(channel.id);
        
        const webhooks = await channel.fetchWebhooks();

        const webhook = webhooks.find(w => w.owner.id == this.bot.client.user.id && w.name == 'ticket-relay')
            ?? (await channel.createWebhook({
                name: 'ticket-relay',
                reason: 'Relay user ticket messages into ticket threads',
            }));
        
        this.hooks.set(channel.id, webhook);
        
        return webhook;
    }

    async sendMessageTicket(thread: ForumThreadChannel, user: User, message: Message) {
        const webhook = await this.getChannelWebhook(thread.parent as ForumChannel);

        try {
            await webhook.send({
                threadId: thread.id,
                username: user.username,
                avatarURL: user.displayAvatarURL(),
                content: message.content,
                files: [...message.attachments.values()],
                allowedMentions: { parse: [] },
            });

            await message.react('✅');
        } catch {
            Logger.warn('Could not send a ticket message');
        }
    }

    async sendTicketDM(userId: string, message: Message) {
        this.sendMessageUser(userId, {
            content: message.content,
            files: [...message.attachments.values()],
            allowedMentions: { parse: [] },
        });
    }

    async sendReplyDM(userId: string, message: string, files: Attachment[]) {
        this.sendMessageUser(userId, {
            content: message,
            files,
            allowedMentions: { parse: [] }
        });
    }
}