import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandStringOption } from 'discord.js';
import { Bot } from '../../../bot';
import { Command, CommandPermissionLevel } from '../../command';
import { getFooter } from '../../../utils/embed';

export default class Leave extends Command {
    constructor () {
        super({
            name: 'leave',
            description: 'Leaves and blacklists a guild',
            permissionLevel: CommandPermissionLevel.DEV,
            options: [
                new SlashCommandStringOption()
                    .setName('guild')
                    .setDescription('ID of the guild')
                    .setRequired(true),
            ]
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        if (command.user.id !== process.env['DEV_USER']) return;
        const guild = command.options.getString('guild', true);

        const left = await bot.client.guilds.cache.get(guild)?.leave().catch(() => undefined);

        if (left) {
            command.editReply({
                content: 'Left successfully',
            });
        } else {
            command.editReply({
                content: 'Unable to leave the guild',
            });
        }
    }
}