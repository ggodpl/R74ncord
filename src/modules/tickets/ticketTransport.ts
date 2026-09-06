import { Attachment, ForumChannel, ForumThreadChannel, Message, MessageCreateOptions, MessagePayload, User, Webhook, WebhookType } from 'discord.js';
import { Base } from '../../base';
import { Logger } from '../../logger';
export class TicketTransport extends Base {
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

    async sendMessageTicket(thread: ForumThreadChannel, user: User, message: Message) {
        const webhook = await this.bot.webhooks.getChannelWebhook(thread.parent as ForumChannel, 'ticket-relay');
        if (!webhook) return;
        if (await this.bot.policy.hasUserOptedOutOfMessageContent(message.author.id)) return;

        try {
            await webhook.send({
                threadId: thread.id,
                username: user.username,
                avatarURL: user.displayAvatarURL(),
                content: message.content,
                files: [...message.attachments.values()],
                allowedMentions: { parse: [] },
            });

            await message.react('🟢');
        } catch {
            Logger.warn('Could not send a ticket message');
            try {
                await message.react('🔴');
            } catch {};
        }
    }

    async sendTicketDM(userId: string, message: Message) {
        if (await this.bot.policy.hasUserOptedOutOfMessageContent(message.author.id)) return;
        
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