
import { ChatInputCommandInteraction, SlashCommandIntegerOption } from 'discord.js';
import { Command, CommandPermissionLevel } from '../../command';
import { Bot } from '../../../bot';

export default class SetFreePingMinLevel extends Command {
    constructor () {
        super({
            name: 'set-free-ping-min-level',
            description: 'Sets free ping\'s min level',
            permissionLevel: CommandPermissionLevel.ADMIN,
            options: [
                new SlashCommandIntegerOption()
                    .setName('level')
                    .setDescription('Minimum level')
                    .setRequired(true)
                    .setMinValue(0)
            ]
        })
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        const level = command.options.getInteger('level', true);

        await bot.freePing.repository.setFreePingSettings(command.guildId!, undefined, undefined, undefined, undefined, undefined, level);
        await command.editReply('Minimum level set succesfully!');
    }
}