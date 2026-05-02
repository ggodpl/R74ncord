import { ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../command';
import { Bot } from '../../../bot';

export default class Close extends Command {
    constructor () {
        super({
            name: 'close',
            description: 'Closes your active ticket',
            dm: true,
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction): Promise<void> {
        if (await bot.tickets.getTicketByUser(command.user.id)) {
            const result = await bot.tickets.closeTicket(command.user.id, command.user.id);

            if (result.success) {
                command.editReply('Ticket closed successfully');
            } else {
                command.editReply(result.reason || 'An unknown error occurred while closing the ticket');
            }
        } else {
            command.editReply('You have no active tickets');
        }
    }
}