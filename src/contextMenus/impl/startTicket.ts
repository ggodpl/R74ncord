import { ApplicationCommandType, CacheType, UserContextMenuCommandInteraction } from 'discord.js';
import { ContextMenu } from '../contextMenu';
import { CommandPermissionLevel } from '../../commands/command';
import { Bot } from '../../bot';

export default class StartTicket extends ContextMenu<ApplicationCommandType.User> {
    constructor () {
        super({
            name: 'Start ticket',
            type: ApplicationCommandType.User,
            permissionLevel: CommandPermissionLevel.CHAT_MOD,
            isEphemeral: true,
        })
    }

    async execute(bot: Bot, interaction: UserContextMenuCommandInteraction<CacheType>): Promise<void> {
        const res = await bot.tickets.createTicket(interaction.targetUser.id, {});
        if (!res.success) {
            interaction.editReply(`Could not open a ticket. ${res.reason}`);
            return;
        }

        const ticket = await bot.tickets.getTicketByUser(interaction.targetUser.id);

        interaction.editReply(`Successfully opened a ticket: <#${ticket.channelId}>`);
    }
}