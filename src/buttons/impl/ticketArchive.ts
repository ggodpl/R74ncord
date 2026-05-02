import { ButtonInteraction, InteractionEditReplyOptions } from 'discord.js';
import { Bot } from '../../bot';
import { Button } from '../button';
import { TicketMessages } from '../../modules/tickets/ticketMessages';

export default class TicketArchive extends Button {
    constructor () {
        super({
            name: 'ticket-archive'
        });
    }

    async execute(bot: Bot, interaction: ButtonInteraction, ticketId: string): Promise<void> {
        const { success, reason } = await bot.tickets.archiveTicket(parseInt(ticketId));
        
        if (!success) {
            interaction.editReply(`Ticket was not archived successfully. ${reason}`);
            return;
        }

        if (interaction.guild) {
            interaction.editReply(TicketMessages.archived() as InteractionEditReplyOptions);
        } else {
            interaction.editReply(TicketMessages.archivedDM() as InteractionEditReplyOptions)
        }
    }
}