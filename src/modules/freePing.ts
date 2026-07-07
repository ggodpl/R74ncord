import { Colors, EmbedBuilder, GuildTextBasedChannel, Message, ThreadChannel, WebhookMessageCreateOptions } from 'discord.js';
import { Base, Messagable } from '../base';
import { Bot } from '../bot';
import FreePingRoles from '../mongodb/models/FreePingRoles';
import { getRelativeTimestamp } from '../utils/date';
import { sleep } from '../utils/sleep';
import { Logger } from '../logger';
import { getFooter } from '../utils/embed';
import { omitUndefined } from 'mongoose';

class FreePingRepository {
    static async setFreePingSettings(guildId: string, pingingRole?: string, pingableRole?: string, guildCooldown?: number, channelCooldown?: number, userCooldown?: number, minimumLevel?: number) {
        await FreePingRoles.updateOne({
            guildId,
        }, omitUndefined({
            pingingRole,
            pingableRole,
            guildCooldown,
            channelCooldown,
            userCooldown,
            minimumLevel,
        }), {
            upsert: true,
        })
    }

    static async getFreePingSettings(guildId: string) {
        return await FreePingRoles.findOne({
            guildId,
        }).lean();
    }
}

export class FreePing extends Base implements Messagable<true> {
    repository = FreePingRepository;
    guildPings: Map<string, number>;
    channelPings: Map<string, number>;
    userPings: Map<string, number>;

    constructor (bot: Bot) {
        super(bot);
        this.guildPings = new Map();
        this.channelPings = new Map();
        this.userPings = new Map();
    }

    async tempReply(message: Message<true>, embed: EmbedBuilder) {
        try {
            const m = await message.reply({
                embeds: [embed],
            });
    
            await sleep(5000);
    
            if (m.deletable) await m.delete();
        } catch {}
    }

    async onMessage(message: Message<true>) {
        if (message.author.bot) return;
        if (!message.guild) return;

        const settings = await this.repository.getFreePingSettings(message.guildId);

        if (!settings) return;

        const {
            pingableRole,
            pingingRole,
            guildCooldown,
            channelCooldown,
            userCooldown,
            minimumLevel,
        } = settings;

        if (!pingableRole) return;
        if (!pingingRole) return;

        if (!message.content.includes(`<@&${pingableRole}>`)) return;
        const userLevel = await this.bot.levels.getUser(message.author.id, message.guildId);
        if (userLevel.level < (minimumLevel ?? 0)) {
            const embed = new EmbedBuilder()
                .setColor(Colors.Red)
                .setTitle('Free Ping')
                .setDescription(`You have to be at least level ${minimumLevel ?? 0} to use Free Ping!`)
                .setFooter(getFooter(message.author.displayAvatarURL()));
            await this.tempReply(message, embed);
            return;
        }

        const userKey = `${message.guildId}_${message.author.id}`;
        
        const now = Date.now();

        const lastGuildPing = this.guildPings.get(message.guildId);
        if (lastGuildPing && guildCooldown && lastGuildPing + guildCooldown > now) {
            const duration = lastGuildPing + guildCooldown - now;
            const embed = new EmbedBuilder()
                .setColor(Colors.Red)
                .setTitle('Free Ping')
                .setDescription(`Free ping is on cooldown! You can ping it ${getRelativeTimestamp(duration)}`)
                .setFooter(getFooter(message.author.displayAvatarURL()));
            await this.tempReply(message, embed);
            return;
        }

        const lastChannelPing = this.channelPings.get(message.channelId);
        if (lastChannelPing && channelCooldown && lastChannelPing + channelCooldown > now) {
            const duration = lastChannelPing + channelCooldown - now;
            const embed = new EmbedBuilder()
                .setColor(Colors.Red)
                .setTitle('Free Ping')
                .setDescription(`Free ping was recently pinged on this channel! You can ping it ${getRelativeTimestamp(duration)}`)
                .setFooter(getFooter(message.author.displayAvatarURL()));
            await this.tempReply(message, embed);
            return;
        }

        const lastUserPing = this.userPings.get(userKey);
        if (lastUserPing && userCooldown && lastUserPing + userCooldown > now) {
            const duration = lastUserPing + userCooldown - now;
            const embed = new EmbedBuilder()
                .setColor(Colors.Red)
                .setTitle('Free Ping')
                .setDescription(`You pinged free ping recently! You can ping it again ${getRelativeTimestamp(duration)}`)
                .setFooter(getFooter(message.author.displayAvatarURL()));
            await this.tempReply(message, embed);
            return;
        }
        
        this.guildPings.set(message.guildId, now);
        this.channelPings.set(message.channelId, now);
        this.userPings.set(userKey, now);

        const webhookChannel = message.channel.isThread() ? message.channel.parent : message.channel as Exclude<GuildTextBasedChannel, ThreadChannel>;
        if (!webhookChannel) return;

        const webhook = await this.bot.webhooks.getChannelWebhook(webhookChannel, 'free-ping-relay');
        if (!webhook) return;

        try {
            const options: WebhookMessageCreateOptions = {
                username: message.author.username,
                avatarURL: message.member?.displayAvatarURL() ?? message.author.displayAvatarURL(),
                content: message.content.replaceAll(`<@&${pingableRole}>`, `<@&${pingingRole}>`),
                files: [...message.attachments.values()],
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [pingingRole],
                },
            }
            if (message.channel.isThread()) options['threadId'] = message.channelId;

            await webhook.send(options);

            if (message.deletable) await message.delete();
        } catch (err) {
            Logger.warn(`Could not send a free ping message: ${err}`);
            this.bot.webhooks.destroy(webhookChannel, 'free-ping-relay')
        }
    }
}