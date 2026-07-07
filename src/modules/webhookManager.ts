import { CategoryChannel, GuildBasedChannel, ThreadChannel, Webhook } from 'discord.js';
import { Base } from '../base';

type WebhookChannel = Exclude<GuildBasedChannel, ThreadChannel | CategoryChannel>;

export class WebhookManager extends Base {
    private hooks: Map<string, Map<string, Webhook>> = new Map();

    async getChannelWebhook(channel: WebhookChannel, webhookName: string) {
        if (this.hooks.has(channel.id) && this.hooks.get(channel.id)!.has(webhookName)) return this.hooks.get(channel.id)!.get(webhookName);

        const webhooks = await channel.fetchWebhooks();

        const webhook = webhooks.find(w => w.owner?.id == this.bot.client.user?.id && w.name == webhookName)
            ?? (await channel.createWebhook({
                name: webhookName,
                reason: 'Internal bot webhook',
            }));
        
        if (!this.hooks.has(channel.id)) this.hooks.set(channel.id, new Map());
        this.hooks.get(channel.id)!.set(webhookName, webhook);

        return webhook;
    }

    destroy(channel: WebhookChannel, webhookName: string) {
        const channelHooks = this.hooks.get(channel.id);
        if (!channelHooks) return;

        channelHooks.delete(webhookName);
    }
}