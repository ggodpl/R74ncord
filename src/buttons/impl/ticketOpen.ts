import { ButtonInteraction, InteractionEditReplyOptions } from 'discord.js';
import { Bot } from '../../bot';
import { Button } from '../button';
import { TicketMessages } from '../../modules/tickets/ticketMessages';
import { QuickStart } from '../../modules/tickets/tickets';

export default class TicketOpen extends Button {
    constructor () {
        super({
            name: 'ticket-open'
        });
    }

    async execute(bot: Bot, interaction: ButtonInteraction, userId: string, guildId?: string, caseId?: string): Promise<void> {
        if (guildId && !caseId && !bot.client.guilds.cache.has(guildId) && process.env['BASE_TICKET_GUILD']) {
            caseId = guildId;
            guildId = process.env['BASE_TICKET_GUILD'];
        }

        if (!guildId) {
            const guilds = await bot.tickets.getMutualGuilds(userId);
            interaction.editReply(TicketMessages.openTicket(interaction.user, guilds) as InteractionEditReplyOptions);
            return;
        }

        const quickStart: QuickStart = {};
        if (caseId) quickStart['caseId'] = parseInt(caseId);

        const reply = await bot.tickets.openTicketForUser(guildId, userId, quickStart);
        interaction.editReply(reply as InteractionEditReplyOptions);
    }
}
