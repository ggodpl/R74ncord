import { Base } from "../base";
import LevelSchema from "../mongodb/models/LevelSchema";

export class LevelsModule extends Base {
    async getUserXP(userId: string, guildId: string) {
        const data = await LevelSchema.findOneAndUpdate({ _id: userId, guildId }, {}, { upsert: true, new: true });

        return data.xp;
    }
}