import { AttachmentBuilder, ChatInputCommandInteraction, ForumThreadChannel, SlashCommandUserOption } from 'discord.js';
import { Command, CommandPermissionLevel } from '../../command';
import { Bot } from '../../../bot';

export default class TicketTranscript extends Command {
    constructor () {
        super({
            name: 'ticket-transcript',
            description: 'Creates a transcript of the ticket',
            permissionLevel: CommandPermissionLevel.MOD,
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction): Promise<void> {
        if (bot.tickets.isTicket(command.channelId)) {
            const ticket = await bot.tickets.getTicket(command.channelId);
            const transcript = await bot.tickets.generateTicketTranscript(command.channel as ForumThreadChannel);
            const transcriptName = `ticket-${ticket.userId}-${ticket.ticketId}.html`;
            
            command.editReply({
                files: [new AttachmentBuilder(transcript).setName(transcriptName)],
            });
        } else {
            command.editReply('No active ticket found for this channel');
        }
    }
}