import { Base } from "../base";
import LevelElements from "../mongodb/models/LevelElements";
import elements from "../../static/data/elements.json";

export class LevelElementsModule extends Base {
    async getLevelElements(guildId: string) {
        return await LevelElements.find({
            _id: guildId
        });
    }

    async getLevelElement(guildId: string, level: number): Promise<string | undefined> {
        const result = await LevelElements.aggregate([
            { $match: { _id: guildId, level: { $lte: level } } },
            { $sort: { level: -1 } },
            { $limit: 1 }
        ]);

        return result?.[0]?.element ?? "sand";
    }

    async addLevelElement(guildId: string, level: number, element: string) {
        await LevelElements.findOneAndUpdate({
            _id: guildId,
            level
        }, {
            element
        }, {
            upsert: true
        });
    }

    async removeLevelElement(guildId: string, level: number) {
        await LevelElements.findOneAndDelete({
            _id: guildId,
            level
        });
    }

    static getElementColors(element: string) {
        const color = elements[element] ?? elements.sand;
        return Array.isArray(color[0]) ? color : [color];
    }

    static isElement(element: string) {
        return !!elements[element];
    }
}