import { ChatInputCommandInteraction, FileUploadBuilder, LabelBuilder, ModalBuilder, ModalSubmitInteraction, SlashCommandStringOption, TextInputBuilder, TextInputStyle } from 'discord.js';
import { Command, CommandPermissionLevel, ModalCommand } from '../../command';
import { Bot } from '../../../bot';

export default class Reply extends Command implements ModalCommand {
    constructor () {
        super({
            name: 'reply',
            description: 'Replies to the user in a ticket',
            permissionLevel: CommandPermissionLevel.CHAT_MOD,
            isModal: true,
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction): Promise<void> {
        const ticket = await bot.tickets.getTicketByChannel(command.channelId);
    
        if (!ticket) {
            command.editReply('You can only use this command in active thread channels');
            return;
        }

        const modal = new ModalBuilder()
            .setCustomId('commands-reply-modal')
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
        
        await command.showModal(modal);
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