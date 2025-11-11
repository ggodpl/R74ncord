import { ChannelType, GuildTextBasedChannel } from "discord.js";
import { Base } from "../base";
import { Bot } from "../bot";
import LevelSchema from "../mongodb/models/LevelSchema";
import { LevelsModule } from "./levels";

const COOLDOWN = 1000;
const COOLDOWN_SPAM_THRESHOLD = 700;

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
        if (Date.now() - cooldown < (COOLDOWN - COOLDOWN_SPAM_THRESHOLD)) {
            this.xpCooldowns.set(userId, this.xpCooldowns.get(userId) + COOLDOWN / 2);
        }

        return true;
    }

    async gain(userId: string, guildId: string) {
        if (this.cooldown(userId)) return;
        this.xpCooldowns.set(userId, Date.now() + COOLDOWN);

        const amount = Math.floor(Math.random() * 10) + 15;

        const user = await LevelSchema.findByIdAndUpdate(userId, {
            $inc: { xp: amount }
        }, {
            upsert: true,
            new: true
        });

        if (LevelsModule.getRelativeXP(user.xp, user.level) > LevelsModule.getLevelXP(user.level)) this.levelUp(userId, guildId);
    }

    async levelUp(userId: string, guildId: string) {
        await LevelSchema.findByIdAndUpdate(userId, {
            $inc: { level: 1 }
        }, {
            upsert: true
        });

        this.annouce(userId, guildId);
    }

    async annouce(userId: string, guildId: string) {
        const user = await this.bot.levels.getUser(userId, guildId);

        const guildSettings = await this.bot.settings.getGuildSettings(guildId);
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