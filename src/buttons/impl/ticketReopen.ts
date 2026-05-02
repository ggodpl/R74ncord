import { ButtonInteraction, InteractionEditReplyOptions } from 'discord.js';
import { Bot } from '../../bot';
import { Button } from '../button';
import { TicketMessages } from '../../modules/tickets/ticketMessages';

export default class TicketReopen extends Button {
    constructor () {
        super({
            name: 'ticket-reopen'
        });
    }

    async execute(bot: Bot, interaction: ButtonInteraction, ticketId: string): Promise<void> {
        const ticket = await bot.tickets.getTicketById(parseInt(ticketId));
        if (!ticket) {
            interaction.reply('Invalid ticket');
            return;
        }

        if (ticket.status != 'closed') {
            interaction.reply(ticket.status == 'open' ? 'Ticket is not closed' : 'Ticket is already archived, you cannot re-open it');
            return;
        }

        const adminClosed = ticket.closedBy != ticket.userId;
        const adminReopened = ticket.userId != interaction.user.id;

        if (adminClosed && !adminReopened) {
            interaction.editReply(TicketMessages.ticketClosedByAdminCantReopen() as InteractionEditReplyOptions);
            return;
        }

        if (!adminClosed && adminReopened) {
            interaction.editReply(TicketMessages.ticketClosedByUserCantReopen() as InteractionEditReplyOptions);
            return;
        }

        const { success, reason } = await bot.tickets.reopenTicket(parseInt(ticketId), interaction.user.id, false);
        if (!success) {
            interaction.editReply(`Ticket cannot be re-opened. ${reason}`);
            return;
        }

        if (adminReopened) {
            interaction.editReply(TicketMessages.ticketReopened() as InteractionEditReplyOptions);
        } else {
            interaction.editReply(TicketMessages.ticketReopenedDM() as InteractionEditReplyOptions);
        }
    }
}