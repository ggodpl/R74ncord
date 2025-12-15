import { Base } from "../base";
import { Logger } from "../logger";
import LevelRoles from "../mongodb/models/LevelRoles";

export class LevelRolesModule extends Base {
    async getLevelRoles(guildId: string) {
        return await LevelRoles.find({
            guildId
        });
    }

    async getLevelRole(guildId: string, level: number) {
        const result = await LevelRoles.aggregate([
            { $match: { guildId, level: { $lte: level } } },
            { $sort: { level: -1 } },
            { $limit: 1 }
        ]);

        return result[0];
    }

    async editLevelRole(guildId: string, level: number, roleId?: string, keep?: boolean) {
        const updateDocument = {};

        if (typeof roleId !== 'undefined') {
            updateDocument['role'] = roleId;
        }
        if (typeof keep !== 'undefined') {
            updateDocument['keep'] = keep;
        }

        await LevelRoles.findOneAndUpdate({
            guildId,
            level
        }, { $set: updateDocument }, {
            upsert: true
        });
    }

    async addLevelRole(guildId: string, level: number, roleId: string, keep?: boolean) {
        await LevelRoles.findOneAndUpdate({
            guildId,
            level
        }, {
            role: roleId,
            keep
        }, {
            upsert: true
        });
    }

    async removeLevelRole(guildId: string, level: number) {
        await LevelRoles.findOneAndDelete({
            guildId,
            level
        });
    }

    async levelUp(userId: string, guildId: string, level: number) {
        const role = await this.getLevelRole(guildId, level);
        if (!role) return;

        const guild = this.bot.client.guilds.cache.get(guildId);
        const member = await guild.members.fetch(userId);

        const previousRoles = await LevelRoles.find({
            guildId,
            level: { $lt: level },
            keep: { $ne: true }
        });

        try {
            const rolesToRemove = previousRoles
                .map(r => r.role)
                .filter(roleId => member.roles.cache.has(roleId) && roleId != role.role);
            
            if (rolesToRemove.length > 0) {
                await member.roles.remove(rolesToRemove);
            }
        } catch (err) {
            Logger.error(`Error removing level roles: ${err}`, "LEVEL ROLES");
        }

        if (member.roles.cache.has(role.role)) return;

        try {
            await member.roles.add(role.role);
        } catch (err) {
            Logger.error(`Error adding level role: ${err}`, "LEVEL ROLES")
        }
    }
}