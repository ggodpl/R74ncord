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
        if (!interaction.inGuild()) return void interaction.editReply('This button can only be used in a server');

        await bot.tickets.blockUser(interaction.guildId, userId);

        interaction.editReply(`Successfully blocked <@${userId}> from opening new tickets. If you wish to unblock this user, use /ticket-unblock.`);
    }
}