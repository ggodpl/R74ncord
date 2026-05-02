import { ButtonBuilder, ButtonStyle, Colors, ContainerBuilder, EmbedBuilder, MessageFlags, MessageCreateOptions, User, AttachmentBuilder } from 'discord.js';
import Tickets from '../../mongodb/models/Tickets';
import Infractions from '../../mongodb/models/Infractions';
import ms from 'ms';
import { getFooter } from '../../utils/embed';
import { formatDate } from '../../utils/date';

type Ticket = InstanceType<typeof Tickets>;
type Infraction = InstanceType<typeof Infractions>;

export class TicketMessages {
    public static readonly RESPONSES = {
        ALREADY_OPEN: 'You already have an open ticket. Please close your existing ticket before opening a new one.',
        NOT_READY: 'The ticketing system is not ready yet. Please contact the server moderators.',
        NO_GUILD: 'The bot is not in the guild. Please contact the server moderators.',
        NO_CHANNEL: 'The ticket forum channel is not set up correctly. Please contact the server moderators.',
        INVALID_CASE: 'The provided case ID is invalid. Please provide a valid case ID or leave it blank.',
        NO_TICKET: 'No active ticket found.',
        NO_THREAD: 'No ticket thread found.',
        ALREADY_CLOSED: 'Ticket already closed.',
        CLOSED: 'This ticket is closed. You cannot send any new messages.',
        STILL_OPEN: 'Ticket is still open.',
        ARCHIVED: 'Ticket is archived.',
        OK: 'OK',
    } as const;

    private static container(container: ContainerBuilder): MessageCreateOptions {
        return {
            components: [container],
            flags: [MessageFlags.IsComponentsV2]
        }
    }

    static starterComponent(user: User, ticket: Ticket): ContainerBuilder {
        return new ContainerBuilder()
            .setAccentColor(0x00ffff)
            .addTextDisplayComponents(t => t.setContent(`${user} (\`${user.username}\`} created a new ticket (#${ticket.ticketId}). You can use this channel to discuss this case with other moderators.\nTo reply, use the /reply command or use the Reply context menu on an already sent message. The user will not see your username.\nYou can close the ticket using buttons below, or by using the /ticket-close command.\n`))
            .addSeparatorComponents(s => s)
            .addActionRowComponents(r => r.setComponents(
                new ButtonBuilder().setLabel('Close ticket').setStyle(ButtonStyle.Danger).setCustomId(`ticket-close_${user.id}`),
                new ButtonBuilder().setLabel('Block user').setStyle(ButtonStyle.Danger).setCustomId(`ticket-block_${user.id}`),
            ))
            .addSeparatorComponents(s => s)
            .addTextDisplayComponents(t => t.setContent('All tickets are transcribed and archived for future reference. Please make sure to keep all discussions professional and respectful.'))
            .addSeparatorComponents(s => s)
            .addTextDisplayComponents(t => t.setContent(`-# NOTE: If user is engaging in stalking, targeted harassment, threats, doxxing, attention seeking, or mentally unwell/unstable/obsessive behavior, please **do not respond**. A response is not always necessary, use your best judgement. Do not respond if waiting for a ban by Server Moderators.`));
    }

    static quickStartCaseEmbed(user: User, infraction: Infraction): EmbedBuilder {
        const fields = [
            { name: 'Type', value: `\`${infraction.infractionType}\`` },
            { name: 'Target', value: `<@${infraction.userId}>` },
            { name: 'Moderator', value: infraction.isAutomod ? '`Automod`' : `<@${infraction.moderator}>` },
            { name: 'Reason', value: `\`${infraction.reason ?? 'No reason provided'}\`` },
            { name: 'Case ID', value: `\`${infraction.caseId ?? 0}\`` },
        ];
        
        if (infraction.duration) {
            fields.push({ name: 'Duration', value: `\`${ms(infraction.duration)}\`` });
        }

        return new EmbedBuilder()
            .setTitle('Infraction information')
            .addFields(fields)
            .setColor(Colors.Yellow)
            .setFooter(getFooter(user.displayAvatarURL()));
    }

    static quickStartMessageEmbed(user: User, message: string): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(`${user.username} says...`)
            .setDescription(message)
            .setColor(0xffffff)
            .setFooter(getFooter(user.displayAvatarURL()));
    }

    static closedByAdminMessage(ticket: Ticket): MessageCreateOptions {
        return this.container(
            new ContainerBuilder()
                .setAccentColor(0x00ffff)
                .addTextDisplayComponents(t => t.setContent('This ticket has been marked as closed by a moderator. The user can no longer reply in this ticket. This ticket can still be re-opened or archived.'))
                .addActionRowComponents(r => r.setComponents(
                    new ButtonBuilder().setCustomId(`ticket-reopen_${ticket.ticketId}`).setLabel('Re-open').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId(`ticket-archive_${ticket.ticketId}`).setLabel('Archive').setStyle(ButtonStyle.Danger),
                ))
        );
    }

    static closedByAdminMessageDM(): MessageCreateOptions {
        return this.container(
            new ContainerBuilder()
                .setAccentColor(0x00ffff)
                .addTextDisplayComponents(t => t.setContent('Your ticket has been closed by a moderator. You can no longer reply in this ticket. If you want to discuss this case further, please open a new ticket and reference the previous ticket ID.'))
                .addSeparatorComponents(s => s)
                .addTextDisplayComponents(t => t.setContent('If you believe this action was taken in error, please contact the server moderators.'))
        );
    }

    static closedByUserMessage(ticket: Ticket): MessageCreateOptions {
        return this.container(
            new ContainerBuilder()
                .setAccentColor(0x00ffff)
                .addTextDisplayComponents(t => t.setContent("This ticket has been marked as closed by the user. This ticket can only be re-opened on user's request or force re-opened by Server moderators. Server moderators can also archive this ticket."))
                .addActionRowComponents(r => r.setComponents(
                    new ButtonBuilder().setCustomId(`ticket-force-reopen_${ticket.ticketId}`).setLabel('Force re-open').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId(`ticket-archive_${ticket.ticketId}`).setLabel('Archive').setStyle(ButtonStyle.Danger),
                ))
        );
    }

    static closedByUserMessageDM(ticket: Ticket): MessageCreateOptions {
        return this.container(
            new ContainerBuilder()
                .setAccentColor(0x00ffff)
                .addTextDisplayComponents(t => t.setContent('You have successfully closed the ticket. You can no longer reply in this ticket. If you want to discuss this case further, please re-open this ticket or open a new one after the old one is archived and reference the previous ticket ID.'))
                .addActionRowComponents(r => r.setComponents(
                    new ButtonBuilder().setCustomId(`ticket-reopen_${ticket.ticketId}`).setLabel('Re-open').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId(`ticket-archive_${ticket.ticketId}`).setLabel('Archive').setStyle(ButtonStyle.Secondary),
                ))
        );
    }

    static transcriptMessage(ticket: Ticket, file: Buffer, fileName: string): MessageCreateOptions {
        return {
            embeds: [
                new EmbedBuilder()
                    .setTitle(`Ticket #${ticket.ticketId} archived`)
                    .addFields([
                        { name: 'User', value: `<@${ticket.userId}>` },
                        { name: 'Opened at', value: formatDate(new Date(ticket.createdAt)) }
                    ])
                    .setFooter(getFooter())
            ],
            files: [
                new AttachmentBuilder(file).setName(fileName)
            ]
        }
    }

    static ticketClosedByAdmin() {
        return this.container(
            new ContainerBuilder()
                .addTextDisplayComponents(t => t.setContent('Your ticket has been closed by a moderator. You can no longer reply to this ticket. Once your previous ticket is archived, you can create a new one.'))
        );
    }

    static ticketClosed(ticket: Ticket) {
        return this.container(
            new ContainerBuilder()
                .addTextDisplayComponents(t => t.setContent('Your ticket is currently closed. If you wish, you can re-open or archive it with buttons below. You cannot open new tickets unless you archive the old one.'))
                .addActionRowComponents(r => r.addComponents(
                    new ButtonBuilder().setLabel('Re-open').setCustomId(`ticket-reopen_${ticket.ticketId}`).setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setLabel('Archive').setCustomId(`ticket-archive_${ticket.ticketId}`).setStyle(ButtonStyle.Secondary),
                ))
        );
    }

    static openTicket(user: User) {
        return this.container(
            new ContainerBuilder()
                .addTextDisplayComponents(t => t.setContent('Hi! If you wish to open a new mod-mail ticket, press the button below.'))
                .addActionRowComponents(r => r.addComponents(
                    new ButtonBuilder().setLabel('Open a ticket').setEmoji('✉').setCustomId(`ticket-open_${user.id}`).setStyle(ButtonStyle.Success),
                ))
        );
    }

    static ticketClosedByAdminCantReopen() {
        return this.container(
            new ContainerBuilder()
                .addTextDisplayComponents(t => t.setContent('This ticket has been closed by a moderator and cannot be re-opened. If you wish to discuss this case further, please open a new ticket after the previous is archived and reference the previous ticket ID.'))
        )
    }

    static ticketClosedByUserCantReopen() {
        return this.container(
            new ContainerBuilder()
                .addTextDisplayComponents(t => t.setContent('This ticket has been closed by the user and cannot be re-opened. If you wish to discuss this case further, please open a new ticket after the previous is archived and reference the previous ticket ID or ask a Server Moderator for a force re-open.'))
        )
    }

    static ticketReopened() {
        return this.container(
            new ContainerBuilder()
                .addTextDisplayComponents(t => t.setContent('This ticket has been re-opened. You can continue the discussion with the user.'))
        )
    }

    static ticketReopenedDM() {
        return this.container(
            new ContainerBuilder()
                .addTextDisplayComponents(t => t.setContent('Your ticket has been re-opened. You can continue the discussion with the moderators.'))
        )
    }

    static ticketForceReopenedDM() {
        return this.container(
            new ContainerBuilder()
                .addTextDisplayComponents(t => t.setContent('Your ticket has been re-opened by a moderator. You can continue the discussion with the moderators.'))
        )
    }
    
    static userBlocked() {
        return this.container(
            new ContainerBuilder()
                .addTextDisplayComponents(t => t.setContent('You have been blocked from opening new tickets by a moderator.'))
        )
    }

    static archivedDM() {
        return this.container(
            new ContainerBuilder()
                .addTextDisplayComponents(t => t.setContent('Ticket archived successfully. You can no longer reply in this ticket. If you want to discuss this case further, please open a new ticket and reference the previous ticket ID.'))
        )
    }

    static archived() {
        return this.container(
            new ContainerBuilder()
                .addTextDisplayComponents(t => t.setContent('Ticket archived successfully.'))
        )
    }
}