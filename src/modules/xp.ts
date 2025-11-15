import { ChannelType, GuildTextBasedChannel } from "discord.js";
import { Base } from "../base";
import { Bot } from "../bot";
import LevelSchema from "../mongodb/models/LevelSchema";
import { LevelsModule } from "./levels";
import BlockedChannels from "../mongodb/models/BlockedChannels";

const COOLDOWN = 1000 * 60 * 2;
const COOLDOWN_SPAM_THRESHOLD = 300;
const COOLDOWN_EXTENSION = 3000;

export class XPModule extends Base {
    xpCooldowns: Map<string, number>;

    constructor (bot: Bot) {
        super(bot);
        this.xpCooldowns = new Map();
    }

    cooldown(userId: string) {
        if (!this.xpCooldowns.has(userId)) return false;

        const cooldown = this.xpCooldowns.get(userId);

        if (cooldown < Date.now()) {
            this.xpCooldowns.delete(userId);
            return false;
        }

        // if the user is gaining too often, extend cooldown
        if (Date.now() - cooldown < COOLDOWN_SPAM_THRESHOLD) {
            this.xpCooldowns.set(userId, this.xpCooldowns.get(userId) + COOLDOWN_EXTENSION);
        }

        return true;
    }

    async isBlocked(guildId: string, channelId: string) {
        const res = await BlockedChannels.findOne({
            guildId,
            channelId
        });

        return !!res;
    }

    async gain(userId: string, guildId: string, channelId: string) {
        if (this.cooldown(userId)) return;
        if (await this.isBlocked(guildId, channelId)) return;
        this.xpCooldowns.set(userId, Date.now() + COOLDOWN);

        const amount = Math.floor(Math.random() * 10) + 15;

        const user = await LevelSchema.findOneAndUpdate({ userId, guildId }, {
            $inc: { xp: amount }
        }, {
            upsert: true,
            new: true
        });

        if (LevelsModule.getRelativeXP(user.xp, user.level) > LevelsModule.getLevelXP(user.level)) this.levelUp(userId, guildId);
    }

    async levelUp(userId: string, guildId: string) {
        const level = await LevelSchema.findOneAndUpdate({ userId, guildId }, {
            $inc: { level: 1 }
        }, {
            upsert: true,
            new: true
        });

        this.annouce(userId, guildId);
        this.bot.levelRoles.levelUp(userId, guildId, level.level);
    }

    async annouce(userId: string, guildId: string) {
        const user = await this.bot.levels.getUser(userId, guildId);

        const guildSettings = await this.bot.settings.getGuildSettings(guildId);
        if (!guildSettings) return;
        const channelId = guildSettings.channel;
        if (!channelId) return;

        const guild = this.bot.client.guilds.cache.get(guildId);
        const channel = await guild.channels.fetch(channelId);
        if (!channel || channel.type != ChannelType.GuildText) return;
        
        const message = guildSettings.message
            .replace(/%user%/g, `<@${userId}>`)
            .replace(/%level%/g, `${user.level}`)
            .replace(/%xp%/g, `${user.xp}`)
            .replace(/%rank%/g, `${user.rank}`);

        (channel as GuildTextBasedChannel).send(message);
    }
}