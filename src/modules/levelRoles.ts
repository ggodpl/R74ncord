import { Base } from "../base";
import { Logger } from "../logger";
import LevelRoles from "../mongodb/models/LevelRoles";

export class LevelRolesModule extends Base {
    async getLevelRoles(guildId: string) {
        return await LevelRoles.find({
            _id: guildId
        });
    }

    async getLevelRole(guildId: string, level: number) {
        return await LevelRoles.findOne({
            _id: guildId,
            level
        });
    }

    async addLevelRole(guildId: string, level: number, roleId: string) {
        await LevelRoles.findOneAndUpdate({
            _id: guildId,
            level
        }, {
            role: roleId
        }, {
            upsert: true
        });
    }

    async removeLevelRole(guildId: string, level: number) {
        await LevelRoles.findOneAndDelete({
            _id: guildId,
            level
        });
    }

    async levelUp(userId: string, guildId: string, level: number) {
        const role = await this.getLevelRole(guildId, level);
        if (!role) return;

        const guild = this.bot.client.guilds.cache.get(guildId);
        const member = await guild.members.fetch(userId);

        try {
            await member.roles.add(role.role);
        } catch (err) {
            Logger.error(`Error adding level role: ${err}`, "LEVEL ROLES")
        }
    }
}