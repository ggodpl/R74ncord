import { Base } from "../base";
import GuildSettings from "../mongodb/models/GuildSettings";

export class SettingsModule extends Base {
    async getGuildSettings(guildId: string) {
        return await GuildSettings.findById(guildId);
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
}