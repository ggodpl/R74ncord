import { ChatInputCommandInteraction, SlashCommandAttachmentOption, SlashCommandStringOption } from 'discord.js';
import { Bot } from '../../../bot';
import { Command, CommandPermissionLevel } from '../../command';
import LevelSchema from '../../../mongodb/models/LevelSchema';
import { LevelsModule } from '../../../modules/levels';
import axios from 'axios';
import fs from 'fs';

export default class MassRecalculate extends Command {
    constructor () {
        super({
            name: 'mass-recalculate',
            description: 'Recalculates levels to the new curve',
            permissionLevel: CommandPermissionLevel.MOD,
            options: [
                new SlashCommandAttachmentOption()
                    .setName('levels')
                    .setDescription('File containing user levels')
                    .setRequired(true),
                new SlashCommandStringOption()
                    .setName('guild-id')
                    .setDescription('guild id')
                    .setRequired(false)
            ]
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        const rawLevels = command.options.getAttachment('levels', true);
        const guildId = command.options.getString('guild-id', false) || command.guildId;
        const file = await axios.get(rawLevels.url);
        const data = file.data;
        
        const current = await LevelSchema.find({ guildId }).lean();
        const keys = [...new Set([...Object.keys(data), ...current.map(u => u.userId)])]
        
        command.editReply({
            content: `Loading ${keys.length} users...`
        });

        const mapped = keys.map(k => {
            const { xp, level } = this.migrate(k, data[k] ?? 0, current.find(a => a.userId == k)?.xp ?? 0);

            return {
                userId: k,
                xp,
                level
            }
        });

        fs.writeFileSync('recalculated.json', JSON.stringify(mapped));

        command.editReply({
            content: 'Levels recalculated, updating...',
            allowedMentions: {
                users: []
            }
        });

        const bulkOps = mapped.map(u => ({
            updateOne: {
                filter: { userId: u.userId, guildId },
                update: { $set: { xp: u.xp, level: u.level }},
                upsert: true
            }
        }));

        await LevelSchema.bulkWrite(bulkOps);

        command.editReply({
            content: `Updated ${mapped.length} users`,
            allowedMentions: {
                users: []
            }
        });
    }

    migrate(userId: string, initialLevel: number, xp: number) {
        if (initialLevel > 0 && xp == 0) return console.log(userId), {
            xp: 0,
            level: 0
        };

        if (initialLevel === 0) {
            const recalculatedLevel = MassRecalculate.getLevel(xp);
            return {
                xp,
                level: recalculatedLevel
            }
        }

        const newXP = MassRecalculate.sumXP(initialLevel - 1);

        const recalculatedXP = Math.round(LevelsModule.getRelativeXP(xp, initialLevel) + newXP);
        const recalculatedLevel = MassRecalculate.getLevel(recalculatedXP);

        return {
            xp: recalculatedXP,
            level: recalculatedLevel
        }
    }

    static sumXP(level: number) {
        return Array(level).fill(0).map((_, i) => this.getLevelXP(i)).reduce((acc, b) => acc + b, 0);
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
        // .33n^2+89n
        return .33 * (level ** 2) + 89 * level + 100;
    }
}