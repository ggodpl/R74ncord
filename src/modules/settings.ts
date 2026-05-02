import { Base } from "../base";
import GuildSettings from "../mongodb/models/GuildSettings";

export class SettingsModule extends Base {
    async getGuildSettings(guildId: string) {
        return await GuildSettings.findById(guildId).lean();
    }

    async setGuildChannel(guildId: string, channelId: string) {
        return await GuildSettings.findByIdAndUpdate(guildId, {
            channel: channelId
        }, {
            upsert: true
        });
    }

    async setGuildMessage(guildId: string, message: string) {
        return await GuildSettings.findByIdAndUpdate(guildId, {
            message
        }, {
            upsert: true
        });
    }

    async setModLogChannel(guildId: string, channelId: string) {
        return await GuildSettings.findByIdAndUpdate(guildId, {
            modlog: channelId,
        }, {
            upsert: true,
        });
    }

    async setTicketForum(guildId: string, channelId: string) {
        return await GuildSettings.findByIdAndUpdate(guildId, {
            ticketForum: channelId,
        }, {
            upsert: true,
        });
    }

    async setTicketStarterMessage(guildId: string, starterMessage: string) {
        return await GuildSettings.findByIdAndUpdate(guildId, {
            ticketStarterMessage: starterMessage,
        }, {
            upsert: true,
        });
    }

    async setTranscriptChannel(guildId: string, channelId: string) {
        return await GuildSettings.findByIdAndUpdate(guildId, {
            transcriptChannel: channelId,
        }, {
            upsert: true,
        });
    }
}