import { ButtonInteraction, InteractionEditReplyOptions } from 'discord.js';
import { Bot } from '../../bot';
import { Button } from '../button';
import { TicketMessages } from '../../modules/tickets/ticketMessages';

export default class TicketForceReopen extends Button {
    constructor () {
        super({
            name: 'ticket-force-reopen'
        });
    }

    async execute(bot: Bot, interaction: ButtonInteraction, ticketId: string): Promise<void> {
        const ticket = await bot.tickets.getTicketById(parseInt(ticketId));
        if (!ticket) {
            interaction.editReply('Invalid ticket');
            return;
        }

        if (ticket.status != 'closed') {
            interaction.editReply(ticket.status == 'open' ? 'Ticket is not closed' : 'Ticket is already archived, you cannot re-open it');
            return;
        }

        const { success, reason } = await bot.tickets.reopenTicket(parseInt(ticketId), interaction.user.id, true);
        if (!success) {
            interaction.editReply(`Ticket cannot be re-opened. ${reason}`);
            return;
        }

        interaction.editReply(TicketMessages.ticketReopened() as InteractionEditReplyOptions);
    }
}