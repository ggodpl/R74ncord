import { ChatInputCommandInteraction, SlashCommandStringOption } from 'discord.js';
import { Command, CommandPermissionLevel } from '../../command';
import { Bot } from '../../../bot';

export default class Reply extends Command {
    constructor () {
        super({
            name: 'reply',
            description: 'Replies to the user in a ticket',
            permissionLevel: CommandPermissionLevel.CHAT_MOD,
            options: [
                new SlashCommandStringOption()
                    .setName('content')
                    .setDescription('Content of the message')
                    .setRequired(true),
            ]
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction): Promise<void> {
        const content = command.options.getString('content', true);

        const ticket = await bot.tickets.getTicketByChannel(command.channelId);
    
        if (!ticket) {
            command.editReply('You can only use this command in active thread channels');
            return;
        }

        await bot.tickets.reply(command.channelId, content);

        command.editReply('Sent the message to the user');
    }
}