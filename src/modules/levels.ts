import { Base } from "../base";
import LevelSchema from "../mongodb/models/LevelSchema";

export class LevelsModule extends Base {
    static sumXP(level: number) {
        return Array(level + 1).fill(0).map((_, i) => this.getLevelXP(i)).reduce((acc, b) => acc + b, 0);
    }

    static getRelativeXP(xp: number, level: number) {
        return xp - this.sumXP(level - 1);
    }

    static getLevel(xp: number) {
        let level = 0;
        while (xp > this.sumXP(level)) level++;
        
        return level;
    }

    static getLevelXP(level: number) {
        return Math.floor(.33 * (level ** 2) + 89 * level + 100);
    }

    async getUsers(guildId: string, page: number, amount: number) {
        const users = await LevelSchema.aggregate([
            { $match: { guildId } },
            { $sort: { xp: -1 }},
            { $skip: (page - 1) * amount },
            { $limit: amount }
        ]);

        return users;
    }

    async getUser(userId: string, guildId: string) {
        await LevelSchema.findOneAndUpdate(
            { userId, guildId },
            { $setOnInsert: { xp: 0, level: 0 } },
            { upsert: true, new: true }
        );

        const result = await LevelSchema.aggregate([
            { $match: { guildId }},
            { $sort: { xp: -1 }},
            { $group: {
                _id: "$guildId",
                users: { $push: { userId: "$userId", xp: "$xp", level: "$level" } },
            }},
            { $unwind: { path: "$users", includeArrayIndex: "rank" } },
            { $match: { "users.userId": userId } },
            { $project: { 
                rank: { $add: ["$rank", 1] },
                userId: 1,
                xp: "$users.xp",
                level: "$users.level"
            }}
        ]);

        return result[0];
    }

    async getPages(perPage: number) {
        return Math.ceil(await LevelSchema.countDocuments() / perPage);
    }
}