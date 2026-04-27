import { AttachmentBuilder, ButtonBuilder, ButtonStyle, Colors, ContainerBuilder, EmbedBuilder, ForumChannel, ForumThreadChannel, Message, MessageFlags, TextChannel } from 'discord.js';
import { Base, Initializable } from '../base';
import Tickets from '../mongodb/models/Tickets';
import ms from 'ms';
import { getFooter } from '../utils/embed';
import { createTranscript, ExportReturnType } from 'discord-html-transcripts';
import { formatDate } from '../utils/date';
import path from 'path';
import { mkdirSync, writeFileSync } from 'fs';

export interface QuickStart {
    caseId?: number;
    message?: string;
}

const GUILD_ID = process.env['BASE_TICKET_GUILD']!;

export class TicketsModule extends Base implements Initializable<never> {
    private ticketChannels: Set<string> = new Set();
    private TRANSCRIPTS_DIR: string = path.join(process.cwd(), 'data', 'transcripts');
    
    public RESPONSES = {
        ALREADY_OPEN: 'You already have an open ticket. Please close your existing ticket before opening a new one.',
        NOT_READY: 'The ticketing system is not ready yet. Please contact the server moderators.',
        NO_GUILD: 'The bot is not in the guild. Please contact the server moderators.',
        NO_CHANNEL: 'The ticket forum channel is not set up correctly. Please contact the server moderators.',
        INVALID_CASE: 'The provided case ID is invalid. Please provide a valid case ID or leave it blank.',
        NO_TICKET: 'No active ticket found.',
        OK: 'OK',
    };

    async createTicket(userId: string, quickStart: QuickStart) {
        const activeTicket = await Tickets.findOne({
            guildId: GUILD_ID,
            userId
        });

        if (activeTicket) return {
            success: false,
            reason: 'ALREADY_OPEN'
        }

        const settings = await this.bot.settings.getGuildSettings(GUILD_ID);

        const ticketForum = settings.ticketForum;
        if (!ticketForum) return {
            success: false,
            reason: 'NOT_READY'
        }
        
        const guild = this.bot.client.guilds.cache.get(GUILD_ID);
        if (!guild) return {
            success: false,
            reason: 'NO_GUILD'
        }

        const channel = await guild.channels.fetch(ticketForum) as ForumChannel;
        if (!channel) return {
            success: false,
            reason: 'NO_CHANNEL'
        }

        const user = await this.bot.client.users.fetch(userId);

        const starterMessage = (settings.ticketStarterMessage ?? '%user (`%username`) opened a new ticket').replace('%user', `<@${userId}>`).replace('%username', user.username);

        const embeds = [];

        const ticket = await Tickets.create({
            guildId: GUILD_ID,
            userId,
            caseId: quickStart.caseId,
        });

        const starterComponent = new ContainerBuilder()
            .setAccentColor(0x00ffff)
            .addTextDisplayComponents(t => t.setContent(`${user} (\`${user.username}\`} created a new ticket (#${ticket.ticketId}). You can use this channel to discuss this case with other moderators.\nTo reply, use the /reply command. The user will not see your username.\nYou can close the ticket using buttons below, or by using the /ticket-close command.\n`))
            .addSeparatorComponents(s => s)
            .addActionRowComponents(r => r.setComponents(
                new ButtonBuilder().setLabel('Lock ticket').setStyle(ButtonStyle.Secondary).setCustomId(`ticket-lock_${ticket.ticketId}`),
                new ButtonBuilder().setLabel('Close ticket').setStyle(ButtonStyle.Danger).setCustomId(`ticket-close_${ticket.ticketId}`),
                new ButtonBuilder().setLabel('Block user').setStyle(ButtonStyle.Danger).setCustomId(`ticket-block_${ticket.ticketId}`),
            ))
            .addSeparatorComponents(s => s)
            .addTextDisplayComponents(t => t.setContent('All tickets are transcribed and archived for future reference. Please make sure to keep all discussions professional and respectful.'))
            .addSeparatorComponents(s => s)
            .addTextDisplayComponents(t => t.setContent(`-# NOTE: If user is engaging in stalking, targeted harassment, threats, doxxing, attention seeking, or mentally unwell/unstable/obsessive behavior, please **do not respond**. A response is not always necessary, use your best judgement. Do not respond if waiting for a ban by Server Moderators.`));

        if (quickStart.caseId) {
            const infraction = await this.bot.moderation.getCase(GUILD_ID, quickStart.caseId);

            if (!infraction) return {
                success: false,
                reason: 'INVALID_CASE'
            }

            const fields = [
                { name: 'Type', value: `\`${infraction.infractionType}\`` },
                { name: 'Target', value: `<@${userId}>` },
                { name: 'Moderator', value: `<@${infraction.moderator}>` },
                { name: 'Reason', value: infraction.reason },
                { name: 'Case ID', value: `${quickStart.caseId}` },
            ];
            
            if (infraction.duration) {
                fields.push({ name: 'Duration', value: `${ms(infraction.duration)}` });
            }

            const infractionEmbed = new EmbedBuilder()
                .setTitle('Infraction information')
                .addFields(fields)
                .setColor(Colors.Yellow)
                .setFooter(getFooter(user.displayAvatarURL()));

            embeds.push(infractionEmbed);
        }

        const thread = await channel.threads.create({
            name: userId,
            message: {
                content: starterMessage,
                embeds,
            }
        });

        thread.send({
            components: [starterComponent],
            flags: [MessageFlags.IsComponentsV2],
        });

        await Tickets.updateOne({
            ticketId: ticket.ticketId,
        }, {
            channelId: thread.id,
        });
        
        if (quickStart.message) {
            const messageEmbed = new EmbedBuilder()
                .setTitle(`${user.username} says...`)
                .setDescription(quickStart.message)
                .setColor(0xffffff)
                .setFooter(getFooter(user.displayAvatarURL()));
            
            thread.send({ embeds: [messageEmbed] });
        }

        this.ticketChannels.add(thread.id);

        return {
            success: true,
            reason: 'OK'
        }
    }

    isTicket(channelId: string) {
        return this.ticketChannels.has(channelId);
    }

    async getTicket(channelId: string) {
        return await Tickets.findOne({
            guildId: GUILD_ID,
            channelId
        });
    }

    async hasActiveTicket(userId: string) {
        return !!(await Tickets.findOne({
            guildId: GUILD_ID,
            userId
        }));
    }

    async closeTicket(userId: string, admin: boolean) {
        const ticket = await Tickets.findOne({
            guildId: GUILD_ID,
            userId,
        });
        if (!ticket) return {
            success: false,
            reason: 'NO_TICKET',
        }

        const settings = await this.bot.settings.getGuildSettings(GUILD_ID);

        const ticketForum = settings.ticketForum;
        if (!ticketForum) return {
            success: false,
            reason: 'NOT_READY',
        }
        
        const guild = this.bot.client.guilds.cache.get(GUILD_ID);
        if (!guild) return {
            success: false,
            reason: 'NO_GUILD',
        }

        const channel = await guild.channels.fetch(ticketForum) as ForumChannel;
        if (!channel) return {
            success: false,
            reason: 'NO_CHANNEL',
        }

        const thread = await channel.threads.fetch(ticket.channelId);
        if (!thread) return {
            success: false,
            reason: 'NO_THREAD',
        }

        await Tickets.updateOne({
            ticketId: ticket.ticketId
        }, {
            closed: true
        });

        if (admin) {
            const container = new ContainerBuilder()
                .setAccentColor(0x00ffff)
                .addTextDisplayComponents(t => t.setContent('This ticket has been marked as closed by a moderator. The user can no longer reply in this ticket. Server moderators can now delete this ticket.'))
                .addActionRowComponents(r => r.setComponents(
                    new ButtonBuilder().setCustomId(`ticket-delete_${ticket.ticketId}`).setLabel('Delete').setStyle(ButtonStyle.Danger),
                ));
            
            thread.send({
                components: [container],
                flags: [MessageFlags.IsComponentsV2],
            });

            const dm = new ContainerBuilder()
                .setAccentColor(0x00ffff)
                .addTextDisplayComponents(t => t.setContent('Your ticket has been closed by a moderator. You can no longer reply in this ticket. If you want to discuss this case further, please open a new ticket and reference the previous ticket ID.'))
                .addSeparatorComponents(s => s)
                .addTextDisplayComponents(t => t.setContent('If you believe this action was taken in error, please contact the server moderators.'));
            
            const user = await this.bot.client.users.fetch(userId);
            if (user) {
                user.send({
                    components: [dm],
                    flags: [MessageFlags.IsComponentsV2],
                });
            }
        } else {
            const container = new ContainerBuilder()
                .setAccentColor(0x00ffff)
                .addTextDisplayComponents(t => t.setContent("This ticket has been marked as closed by the user. This ticket can only be re-opened on user's request. Server moderators can now delete this ticket."))
                .addActionRowComponents(r => r.setComponents(
                    new ButtonBuilder().setCustomId(`ticket-delete_${ticket.ticketId}`).setLabel('Delete').setStyle(ButtonStyle.Danger),
                ));
            
            thread.send({
                components: [container],
                flags: [MessageFlags.IsComponentsV2],
            });
    
            const dm = new ContainerBuilder()
                .setAccentColor(0x00ffff)
                .addTextDisplayComponents(t => t.setContent('You have successfully closed the ticket. You can still re-open this ticket until a moderator deletes it. If you want to re-open the ticket, please press the button below.'))
                .addActionRowComponents(r => r.setComponents(
                    new ButtonBuilder().setCustomId(`ticket-reopen_${ticket.ticketId}`).setLabel('Re-open ticket').setStyle(ButtonStyle.Primary),
                ));
            
            const user = await this.bot.client.users.fetch(userId);
            if (user) {
                user.send({
                    components: [dm],
                    flags: [MessageFlags.IsComponentsV2],
                });
            }
        }

        return {
            success: true,
            reason: 'OK',
        }
    }

    async deleteTicket(ticketId: string) {
        const ticket = await Tickets.findOne({
            guildId: GUILD_ID,
            ticketId,
        });
        if (!ticket) return {
            success: false,
            reason: 'NO_TICKET',
        }

        const settings = await this.bot.settings.getGuildSettings(GUILD_ID);

        const ticketForum = settings.ticketForum;
        if (!ticketForum) return {
            success: false,
            reason: 'NOT_READY',
        }
        
        const guild = this.bot.client.guilds.cache.get(GUILD_ID);
        if (!guild) return {
            success: false,
            reason: 'NO_GUILD',
        }

        const channel = await guild.channels.fetch(ticketForum) as ForumChannel;
        if (!channel) return {
            success: false,
            reason: 'NO_CHANNEL',
        }

        const thread = await channel.threads.fetch(ticket.channelId);
        if (!thread) return {
            success: false,
            reason: 'NO_THREAD',
        }

        const transcript = await this.generateTicketTranscript(thread);
        const transcriptName = `ticket-${ticket.userId}-${ticket.ticketId}.html`;

        if (settings.transcriptChannel) {
            const transcriptChannel = await guild.channels.fetch(settings.transcriptChannel) as TextChannel;
            if (transcriptChannel) {
                const transcriptEmbed = new EmbedBuilder()
                    .setTitle(`Ticket ${ticket.ticketId} closed`)
                    .addFields([
                        { name: 'User', value: `<@${ticket.userId}>` },
                        { name: 'Opened at', value: formatDate(new Date(ticket.createdAt)) }
                    ])
                    .setFooter(getFooter());

                transcriptChannel.send({
                    embeds: [transcriptEmbed],
                    files: [new AttachmentBuilder(transcript).setName(transcriptName)],
                });
            }
        }

        mkdirSync(path.join(this.TRANSCRIPTS_DIR, 'meta'), { recursive: true });

        writeFileSync(path.join(this.TRANSCRIPTS_DIR, transcriptName), transcript, {
            encoding: 'utf-8'
        });

        const transcriptMetadata = {
            id: ticket.ticketId,
            userId: ticket.userId,
            createdAt: ticket.createdAt,
        };

        writeFileSync(path.join(this.TRANSCRIPTS_DIR, 'meta', `ticket-${ticket.userId}-${ticket.ticketId}.json`), JSON.stringify(transcriptMetadata), {
            encoding: 'utf-8'
        });

        await thread.delete('Ticket closed');

        return {
            success: true,
            reason: 'OK',
        }
    }

    async generateTicketTranscript(thread: ForumThreadChannel) {
        return await createTranscript(thread, {
            limit: -1,
            returnType: ExportReturnType.Buffer,
            saveImages: true,
            footerText: '',
            favicon: 'guild',
        });
    }

    private async getTicketChannelWebhook(channel: ForumChannel) {
        const webhooks = await channel.fetchWebhooks();

        let webhook = webhooks.find(w => w.owner.id == this.bot.client.user.id && w.name == 'ticket-relay') ?? null;

        if (!webhook) {
            webhook = await channel.createWebhook({
                name: 'ticket-relay',
                reason: 'Relay user ticket messages into ticket threads',
            });
        }

        return webhook;
    }

    async sendTicketMessage(userId: string, message: Message, channelId: string) {
        const settings = await this.bot.settings.getGuildSettings(GUILD_ID);

        const ticketForum = settings.ticketForum;
        if (!ticketForum) return;
        
        const guild = this.bot.client.guilds.cache.get(GUILD_ID);
        if (!guild) return;

        const channel = await guild.channels.fetch(ticketForum) as ForumChannel;
        if (!channel) return;

        const thread = await channel.threads.fetch(channelId);
        if (!thread) return;

        const user = await this.bot.client.users.fetch(userId);
        if (!user) return;

        const webhook = await this.getTicketChannelWebhook(channel);

        await webhook.send({
            threadId: channelId,
            username: user.username,
            avatarURL: user.displayAvatarURL(),
            content: message.content,
            files: [...message.attachments.values()],
            allowedMentions: { parse: [] },
        });
    }

    async sendTicketDM(userId: string, message: Message) {
        const user = await this.bot.client.users.fetch(userId);
        if (!user) return;

        user.send({
            content: message.content,
            files: [...message.attachments.values()],
            allowedMentions: { parse: [] },
        });
    }

    async onBotMessaged(message: Message) {
        const ticket = await Tickets.findOne({
            guildId: GUILD_ID,
            userId: message.author.id,
        });

        if (!ticket) {
            // todo: create ticket
        } else {
            this.sendTicketMessage(message.author.id, message, ticket.channelId);
        }
    }

    async onMessage(message: Message) {
        if (!message.guildId) this.onBotMessaged(message);
        else if (this.ticketChannels.has(message.channelId)) {
            const ticket = await Tickets.findOne({
                channelId: message.channelId,
            });

            if (!ticket) return;

            this.sendTicketDM(ticket.userId, message);            
        }
    }

    async initialize(): Promise<boolean> {
        const tickets = await Tickets.find({
            guildId: GUILD_ID,
        }).lean();

        tickets.forEach(t => this.ticketChannels.add(t.channelId));

        return true;
    }
}