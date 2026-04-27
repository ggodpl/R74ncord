import { ChatInputCommandInteraction, SlashCommandUserOption } from 'discord.js';
import { Command, CommandPermissionLevel } from '../../command';
import { Bot } from '../../../bot';

export default class TicketClose extends Command {
    constructor () {
        super({
            name: 'ticket-close',
            description: 'Closes a ticket',
            permissionLevel: CommandPermissionLevel.CHAT_MOD,
            options: [
                new SlashCommandUserOption()
                    .setName('user')
                    .setDescription('User whose ticket to transcribe')
                    .setRequired(false)
            ]
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction): Promise<void> {
        const user = command.options.getUser('user', false);

        if (user) {
            if (await bot.tickets.hasActiveTicket(user.id)) {
                const result = await bot.tickets.closeTicket(user.id, true);

                if (result.success) {
                    command.editReply('Ticket transcribed successfully');
                } else {
                    command.editReply(bot.tickets.RESPONSES[result.reason] || 'An unknown error occurred while closing the ticket');
                }
            } else {
                command.editReply('This user has no active tickets');
            }
        } else {
            if (bot.tickets.isTicket(command.channelId)) {
                const ticket = await bot.tickets.getTicket(command.channelId);
                const result = await bot.tickets.closeTicket(ticket.userId, true);

                if (result.success) {
                    command.editReply('Ticket transcribed successfully');
                } else {
                    command.editReply(bot.tickets.RESPONSES[result.reason] || 'An unknown error occurred while closing the ticket');
                }
            } else {
                command.editReply('No active ticket found for this channel');
            }
        }
    }
}