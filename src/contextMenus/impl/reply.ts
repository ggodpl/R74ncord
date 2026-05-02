import { ApplicationCommandType, CacheType, FileUploadBuilder, LabelBuilder, MessageContextMenuCommandInteraction, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle } from 'discord.js';
import { ContextMenu, ModalContextMenu } from '../contextMenu';
import { CommandPermissionLevel } from '../../commands/command';
import { Bot } from '../../bot';

export default class Reply extends ContextMenu<ApplicationCommandType.Message> implements ModalContextMenu {
    constructor () {
        super({
            name: 'Reply',
            type: ApplicationCommandType.Message,
            permissionLevel: CommandPermissionLevel.CHAT_MOD,
            isModal: true,
        });
    }

    async execute(bot: Bot, interaction: MessageContextMenuCommandInteraction<CacheType>): Promise<void> {
        const ticket = await bot.tickets.getTicketByChannel(interaction.channelId);

        if (!ticket) {
            interaction.editReply('You have to been in a ticket channel to use this context menu!');
            return;
        }

        const modal = new ModalBuilder()
            .setCustomId('context-Reply-modal')
            .setTitle('Reply');
        
        const contentInput = new TextInputBuilder()
            .setCustomId('message-content-input')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(1024)
            .setPlaceholder(`Message @${(await bot.client.users.fetch(ticket.userId)).username}`);

        const contentLabel = new LabelBuilder()
            .setLabel('Message content')
            .setTextInputComponent(contentInput);
    
        const screenshotInput = new FileUploadBuilder()
            .setCustomId('screenshot-input')
            .setRequired(false)
            .setMaxValues(10);
        
        const screenshotLabel = new LabelBuilder()
            .setLabel('File upload')
            .setFileUploadComponent(screenshotInput);
        
        modal.addLabelComponents(contentLabel);
        modal.addLabelComponents(screenshotLabel);
        
        await interaction.showModal(modal);
    }

    async onModal(bot: Bot, interaction: ModalSubmitInteraction): Promise<void> {
        const content = interaction.fields.getTextInputValue('message-content-input');
        const files = interaction.fields.getUploadedFiles('screenshot-input', false);
        
        const attachments = files ? Array.from(files.values()) : [];
        
        const { success, reason } = await bot.tickets.reply(interaction.channelId, content, attachments);
    
        if (!success) {
            interaction.reply(reason);
            return;
        }

        interaction.reply({
            content: `> \`${content}\``,
            files: attachments
        });
    }
}