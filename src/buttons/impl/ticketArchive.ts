import { ButtonInteraction, InteractionEditReplyOptions } from 'discord.js';
import { Bot } from '../../bot';
import { Button } from '../button';
import { TicketMessages } from '../../modules/tickets/ticketMessages';
import { resolveTicketRef } from '../../modules/tickets/tickets';

export default class TicketArchive extends Button {
    constructor () {
        super({
            name: 'ticket-archive'
        });
    }

    async execute(bot: Bot, interaction: ButtonInteraction, ...args: string[]): Promise<void> {
        const ref = resolveTicketRef(interaction, args[0], args[1]);
        if (!ref) return void interaction.editReply('Invalid ticket');

        const { success, reason } = await bot.tickets.archiveTicket(ref.guildId, ref.ticketId);
        
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