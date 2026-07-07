import { ButtonInteraction, InteractionEditReplyOptions } from 'discord.js';
import { Bot } from '../../bot';
import { Button } from '../button';
import { TicketMessages } from '../../modules/tickets/ticketMessages';

export default class TicketClose extends Button {
    constructor () {
        super({
            name: 'ticket-close'
        });
    }

    async execute(bot: Bot, interaction: ButtonInteraction, userId: string): Promise<void> {
        const ticket = await bot.tickets.getTicketByUser(userId);

        const { success, reason } = await bot.tickets.closeTicket(userId, interaction.user.id);

        if (!success) return void interaction.editReply(`Ticket did not close successfully. ${reason}`);
        if (!ticket) return void interaction.editReply('Ticket not found');

        if (userId != interaction.user.id) {
            interaction.editReply(TicketMessages.closedByAdminMessage(ticket) as InteractionEditReplyOptions);
        } else {
            interaction.editReply(TicketMessages.closedByUserMessageDM(ticket) as InteractionEditReplyOptions);
        }
    }
}