import { ApplicationCommandType, CacheType, Message, MessageContextMenuCommandInteraction } from 'discord.js';
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
        if (!interaction.inGuild()) return void interaction.editReply('You need to be in a guild to use this context menu!');
        
        if (!(await bot.tickets.getTicketByChannel(interaction.guildId, interaction.channelId))) {
            interaction.editReply('You have to been in a ticket channel to use this context menu!');
            return;
        }

        const { success, reason } = await bot.tickets.sendMessage(interaction.targetMessage as Message<true>);
        
        if (!success) {
            interaction.editReply(reason);
            return;
        }

        interaction.editReply(`${interaction.targetMessage.url} sent to the user`);
    }
}