import { ChatInputCommandInteraction, SlashCommandChannelOption } from 'discord.js';
import { Command, CommandPermissionLevel } from '../../command';
import { Bot } from '../../../bot';

export default class SetTranscriptChannel extends Command {
    constructor () {
        super({
            name: 'set-transcript-chanel',
            description: 'Sets the transcript channel',
            permissionLevel: CommandPermissionLevel.ADMIN,
            options: [
                new SlashCommandChannelOption()
                    .setName('channel')
                    .setDescription('Transcript channel')
                    .setRequired(true)
            ]
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction): Promise<void> {
        const channel = command.options.getChannel('channel', true);

        await bot.settings.setTranscriptChannel(command.guildId, channel.id);

        command.editReply(`Transcript channel successfully set to ${channel}`);
    }
}