import { AttachmentBuilder, ChatInputCommandInteraction, SlashCommandAttachmentOption, SlashCommandStringOption } from 'discord.js';
import { Bot } from '../../../bot';
import { Command, CommandPermissionLevel } from '../../command';
import LevelSchema from '../../../mongodb/models/LevelSchema';
import axios from 'axios';

export default class LoadBackup extends Command {
    constructor () {
        super({
            name: 'load-backup',
            description: 'Loads a level data backup',
            permissionLevel: CommandPermissionLevel.MOD,
            options: [
                new SlashCommandAttachmentOption()
                    .setName('backup')
                    .setDescription('backup')
                    .setRequired(true),
                new SlashCommandStringOption()
                    .setName('guild-id')
                    .setDescription('guild id')
                    .setRequired(false)
            ]
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        const guildId = command.options.getString('guild-id', false) || command.guildId;
        const backup = command.options.getAttachment("backup", true);
        const file = await axios.get(backup.url);
        const data = file.data;

        command.editReply({
            content: `Loading backup with ${data.length} users...`
        });

        const bulkOps = data.map((user: any) => ({
            updateOne: {
                filter: { userId: user.userId, guildId },
                update: { $set: { xp: user.xp, level: user.level } },
                upsert: true
            }
        }));

        await LevelSchema.bulkWrite(bulkOps);

        command.editReply({
            content: `Successfully loaded backup with ${data.length} users`,
            allowedMentions: {
                users: []
            }
        });
    }
}