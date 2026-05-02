import { Base, Initializable } from '../../base';
import Tickets from '../../mongodb/models/Tickets';
import { TicketMessages } from './ticketMessages';
import { TicketRepository } from './ticketRepository';
import { TicketTransport } from './ticketTransport';
import path from 'path';
import { promises as fs } from 'fs';
import { Bot } from '../../bot';
import { createTranscript, ExportReturnType } from 'discord-html-transcripts';
import { Attachment, ForumChannel, ForumThreadChannel, Guild, Message, MessageFlags, TextChannel } from 'discord.js';

export interface QuickStart {
    caseId?: number;
    message?: string;
}

const GUILD_ID = process.env['BASE_TICKET_GUILD']!;

export class TicketsModule extends Base implements Initializable<never> {
    private ticketChannels: Set<string> = new Set();
    private TRANSCRIPTS_DIR: string = path.join(process.cwd(), 'data', 'transcripts');
    
    private transport: TicketTransport;

    constructor (bot: Bot) {
        super(bot);

        this.transport = new TicketTransport(bot);
    }

    async getTicketThread(channelId: string): Promise<{ success: false, reason: string } | { success: true, reason: string, guild: Guild, channel: ForumChannel, thread: ForumThreadChannel }> {
        const settings = await this.bot.settings.getGuildSettings(GUILD_ID);

        const forum = settings.ticketForum;
        if (!forum) return this.fail('NOT_READY');
        
        const guild = this.bot.client.guilds.cache.get(GUILD_ID);
        if (!guild) return this.fail('NO_GUILD');

        const channel = await guild.channels.fetch(forum) as ForumChannel;
        if (!channel) return this.fail('NO_CHANNEL');

        const thread = await channel.threads.fetch(channelId);
        if (!thread) return this.fail('NO_THREAD');

        return {
            success: true,
            reason: 'OK',
            guild,
            channel,
            thread,
        }
    }

    async createTicket(userId: string, quickStart: QuickStart) {
        const activeTicket = await Tickets.findOne({
            guildId: GUILD_ID,
            userId,
            status: { $ne: 'archived' },
        });

        if (activeTicket) return this.fail('ALREADY_OPEN');

        const settings = await this.bot.settings.getGuildSettings(GUILD_ID);
        
        const ticketForum = settings.ticketForum;
        if (!ticketForum) return this.fail('NOT_READY');

        const guild = this.bot.client.guilds.cache.get(GUILD_ID);
        if (!guild) return this.fail('NO_GUILD');

        const channel = await guild.channels.fetch(ticketForum) as ForumChannel;
        if (!channel) return this.fail('NO_CHANNEL');

        const user = await this.bot.client.users.fetch(userId);
        const ticket = await TicketRepository.createTicket(GUILD_ID, userId, quickStart.caseId);

        const starterComponent = TicketMessages.starterComponent(user, ticket);
        
        const thread = await channel.threads.create({
            name: `${userId} (#${ticket.ticketId})`,
            message: {
                components: [starterComponent],
                flags: [MessageFlags.IsComponentsV2],
            }
        });

        const embeds = [];
        if (quickStart.caseId) {
            const infraction = await this.bot.moderation.getCase(GUILD_ID, quickStart.caseId);

            if (!infraction) return this.fail('INVALID_CASE');

            embeds.push(TicketMessages.quickStartCaseEmbed(user, infraction));
        }
        if (quickStart.message) {
            embeds.push(TicketMessages.quickStartMessageEmbed(user, quickStart.message));
        }

        if (embeds.length) thread.send({ embeds });

        await TicketRepository.addChannelId(GUILD_ID, ticket.ticketId, thread.id);

        this.ticketChannels.add(thread.id);

        return this.success();
    }

    async getTicketByChannel(channelId: string) {
        return await TicketRepository.getTicketChannel(GUILD_ID, channelId);
    }

    async getTicketByUser(userId: string) {
        return await TicketRepository.getTicketUser(GUILD_ID, userId);
    }

    async getTicketById(ticketId: number) {
        return await TicketRepository.getTicket(GUILD_ID, ticketId);
    }

    async closeTicket(userId: string, closedBy: string) {
        const ticket = await TicketRepository.getTicketUser(GUILD_ID, userId);
        if (!ticket) return this.fail('NO_TICKET');

        const res = await this.getTicketThread(ticket.channelId);
        if (!res.success) return res;

        const { thread } = res;

        if (ticket.status != 'open') return this.fail('ALREADY_CLOSED');

        await TicketRepository.closeTicket(GUILD_ID, ticket.ticketId, closedBy);

        if (userId != closedBy) {
            this.transport.sendMessageUser(userId, TicketMessages.closedByAdminMessageDM());
        } else {
            thread.send(TicketMessages.closedByUserMessage(ticket));
        }

        return this.success();
    }

    async archiveTicket(ticketId: number) {
        const ticket = await TicketRepository.getTicket(GUILD_ID, ticketId);
        if (!ticket) return this.fail('NO_TICKET');

        const settings = await this.bot.settings.getGuildSettings(GUILD_ID);

        const res = await this.getTicketThread(ticket.channelId);
        if (!res.success) return res;

        const { guild, thread } = res;

        const transcript = await this.generateTicketTranscript(thread);
        const transcriptName = `ticket-${ticket.userId}-${ticket.ticketId}.html`;

        if (settings.transcriptChannel) {
            const transcriptChannel = await guild.channels.fetch(settings.transcriptChannel) as TextChannel;
            if (transcriptChannel) {
                transcriptChannel.send(TicketMessages.transcriptMessage(ticket, transcript, transcriptName))
            }
        }

        await fs.mkdir(path.join(this.TRANSCRIPTS_DIR, 'meta'), { recursive: true });

        await fs.writeFile(path.join(this.TRANSCRIPTS_DIR, transcriptName), transcript, {
            encoding: 'utf-8'
        });

        const transcriptMetadata = {
            id: ticket.ticketId,
            userId: ticket.userId,
            createdAt: ticket.createdAt,
        };

        await fs.writeFile(path.join(this.TRANSCRIPTS_DIR, 'meta', `ticket-${ticket.userId}-${ticket.ticketId}.json`), JSON.stringify(transcriptMetadata), {
            encoding: 'utf-8'
        });

        TicketRepository.archiveTicket(GUILD_ID, ticketId);

        await thread.setArchived(true, 'Ticket closed');

        this.ticketChannels.delete(ticket.channelId);

        return this.success();
    }

    async reopenTicket(ticketId: number, reopenedBy: string, force: boolean) {
        const ticket = await TicketRepository.getTicket(GUILD_ID, ticketId);
        if (!ticket) return this.fail('NO_TICKET');

        if (ticket.status != 'closed') return this.fail(ticket.status == 'open' ? 'STILL_OPEN' : 'ARCHIVED');

        const res = await this.getTicketThread(ticket.channelId);
        if (!res.success) return res;
        const { thread } = res;

        const adminClosed = ticket.closedBy != ticket.userId;
        const adminReopened = ticket.userId != reopenedBy;

        if ((adminClosed && adminReopened) || (!adminClosed && !adminReopened) || force) {
            await TicketRepository.reopenTicket(GUILD_ID, ticket.ticketId);

            thread.setArchived(false, 'Ticket re-opened');

            if (adminReopened) {
                this.transport.sendMessageUser(ticket.userId, TicketMessages.ticketReopenedDM());
            } else {
                thread.send(TicketMessages.ticketReopened());
            }
        }

        return this.success();
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

    async onMessageDM(message: Message) {
        const ticket = await TicketRepository.getTicketUser(GUILD_ID, message.author.id);

        if (ticket) {
            if (ticket.status != 'open') {
                if (ticket.closedBy != message.author.id) {
                    message.reply(TicketMessages.ticketClosedByAdmin())
                } else {
                    message.reply(TicketMessages.ticketClosed(ticket))
                }
            } else {
                const res = await this.getTicketThread(ticket.channelId);
                if (!res.success) return;

                this.transport.sendMessageTicket(res.thread, message.author, message);
            }
        } else {
            message.reply(TicketMessages.openTicket(message.author));
        }
    }

    async onMessage(message: Message) {
        if (!message.guildId) return this.onMessageDM(message);
    }

    async reply(channelId: string, content: string, files?: Attachment[]) {
        const ticket = await TicketRepository.getTicketChannel(GUILD_ID, channelId);
        if (!ticket) return this.fail('NO_TICKET');

        if (ticket.status != 'open') return this.fail('CLOSED');

        this.transport.sendReplyDM(ticket.userId, content, files ?? []);
    
        return this.success();
    }

    async sendMessage(message: Message) {
        const ticket = await TicketRepository.getTicketChannel(GUILD_ID, message.channel.id);
        if (!ticket) return this.fail('NO_TICKET');

        if (ticket.status != 'open') return this.fail('CLOSED');

        this.transport.sendTicketDM(ticket.userId, message);
    
        return this.success();
    }

    async blockUser(userId: string) {
        await TicketRepository.blockUser(GUILD_ID, userId);
    }

    async unblockUser(userId: string) {
        await TicketRepository.unblockUser(GUILD_ID, userId);
    }

    async isUserBlocked(userId: string) {
        return !!(await TicketRepository.getUserBlock(GUILD_ID, userId));
    }

    isTicket(channelId: string) {
        return this.ticketChannels.has(channelId);
    }

    fail<T extends keyof typeof TicketMessages.RESPONSES>(reason: T): { success: false, reason: (typeof TicketMessages)['RESPONSES'][T] } {
        return {
            success: false,
            reason: TicketMessages.RESPONSES[reason],
        }
    }

    success() {
        return {
            success: true,
            reason: 'OK',
        } as const;
    }

    async initialize() {
        const tickets = await Tickets.find({
            guildId: GUILD_ID,
        }).lean();

        tickets.forEach(t => this.ticketChannels.add(t.channelId));

        return true;
    }
}