import { AttachmentBuilder, ChatInputCommandInteraction, SlashCommandStringOption } from 'discord.js';
import { Bot } from '../../../bot';
import { Command, CommandPermissionLevel } from '../../command';
import LevelSchema from '../../../mongodb/models/LevelSchema';

export default class Backup extends Command {
    constructor () {
        super({
            name: 'backup',
            description: 'Backs level data up',
            permissionLevel: CommandPermissionLevel.MOD,
            options: [
                new SlashCommandStringOption()
                    .setName('guild-id')
                    .setDescription('guild id')
                    .setRequired(false)
            ]
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        const guildId = command.options.getString('guild-id', false) || command.guildId;
        const data = await LevelSchema.find({ guildId }).lean();

        const buffer = Buffer.from(JSON.stringify(data));

        command.editReply({
            content: `Successfully backed up ${data.length} users`,
            allowedMentions: {
                users: []
            },
            files: [
                new AttachmentBuilder(buffer)
                    .setName('backup.json')
            ]
        });
    }
}