import { InteractionEditReplyOptions, StringSelectMenuInteraction } from 'discord.js';
import { Bot } from '../../bot';
import { SelectMenu } from '../selectMenu';

export default class TicketOpen extends SelectMenu {
    constructor () {
        super({
            name: 'ticket-open'
        });
    }

    async execute(bot: Bot, interaction: StringSelectMenuInteraction, values: string[], userId: string): Promise<void> {
        const [guildId] = values;
        if (!guildId) return void interaction.editReply('No server selected');

        const reply = await bot.tickets.openTicketForUser(guildId, userId, {});
        interaction.editReply(reply as InteractionEditReplyOptions);
    }
}
