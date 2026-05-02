import { ButtonInteraction } from 'discord.js';
import { Bot } from '../../bot';
import { Button } from '../button';

export default class TicketBlock extends Button {
    constructor () {
        super({
            name: 'ticket-block'
        });
    }

    async execute(bot: Bot, interaction: ButtonInteraction, userId: string): Promise<void> {
        await bot.tickets.blockUser(userId);

        interaction.editReply(`Successfully blocked <@${userId}> from opening new tickets. If you wish to unblock this user, use /ticket-unblock.`);
    }
}