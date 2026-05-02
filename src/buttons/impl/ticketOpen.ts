import { ButtonBuilder, ButtonInteraction, ButtonStyle, ContainerBuilder, EmbedBuilder, InteractionEditReplyOptions, MessageFlags } from 'discord.js';
import { Bot } from '../../bot';
import { Button } from '../button';
import { TicketMessages } from '../../modules/tickets/ticketMessages';

export default class TicketOpen extends Button {
    constructor () {
        super({
            name: 'ticket-open'
        });
    }

    async execute(bot: Bot, interaction: ButtonInteraction, userId: string, caseId?: string): Promise<void> {
        const quickStart = {};
        if (caseId) quickStart['caseId'] = parseInt(caseId);

        if (await bot.tickets.isUserBlocked(userId)) {
            interaction.editReply(TicketMessages.userBlocked() as InteractionEditReplyOptions);
            return;
        }

        const { success, reason } = await bot.tickets.createTicket(userId, quickStart);
        if (!success) {
            interaction.editReply(`Ticket creation failed. ${reason}`);
            return;
        }

        const ticket = await bot.tickets.getTicketByUser(userId);
        
        const container = new ContainerBuilder()
            .addTextDisplayComponents(t => t.setContent(`Ticket #${ticket.ticketId} created successfully! You can start chatting here, and a staff member will be with you shortly.`))
            .addActionRowComponents(r => r.setComponents(
                new ButtonBuilder().setLabel('Close ticket').setStyle(ButtonStyle.Danger).setCustomId(`ticket-close_${interaction.user.id}`)
            ))
        interaction.editReply({
            components: [container],
            flags: [MessageFlags.IsComponentsV2]
        });
    }
}