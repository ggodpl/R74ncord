import { ApplicationCommandType, CacheType, MessageContextMenuCommandInteraction } from 'discord.js';
import { ContextMenu } from '../contextMenu';
import { CommandPermissionLevel } from '../../commands/command';
import { Bot } from '../../bot';

export default class Send extends ContextMenu<ApplicationCommandType.Message> {
    constructor () {
        super({
            name: 'Send',
            type: ApplicationCommandType.Message,
            permissionLevel: CommandPermissionLevel.CHAT_MOD
        });
    }

    async execute(bot: Bot, interaction: MessageContextMenuCommandInteraction<CacheType>): Promise<void> {
        if (!bot.tickets.getTicketByChannel(interaction.channelId)) {
            interaction.editReply('You have to been in a ticket channel to use this context menu!');
            return;
        }

        const { success, reason } = await bot.tickets.sendMessage(interaction.targetMessage);
        
        if (!success) {
            interaction.editReply(reason);
            return;
        }

        interaction.editReply(`${interaction.targetMessage.url} sent to the user`);
    }
}