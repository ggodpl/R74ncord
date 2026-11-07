import { Base, Initializable, Messagable } from '../../base';
import Tickets from '../../mongodb/models/Tickets';
import { TicketMessages } from './ticketMessages';
import { TicketRepository } from './ticketRepository';
import { TicketTransport } from './ticketTransport';
import path from 'path';
import { promises as fs } from 'fs';
import { Bot } from '../../bot';
import { createTranscript, ExportReturnType } from 'discord-html-transcripts';
import { Attachment, BaseInteraction, ForumChannel, ForumThreadChannel, Guild, Message, MessageCreateOptions, MessageFlags, TextChannel } from 'discord.js';

export interface QuickStart {
    caseId?: number;
    message?: string;
}

const LEGACY_GUILD_ID = process.env['BASE_TICKET_GUILD'];

export function resolveTicketRef(interaction: BaseInteraction, first: string, second?: string): { guildId: string, ticketId: number } | null {
    const guildId = second ? first : (interaction.guildId ?? LEGACY_GUILD_ID);
    const ticketId = parseInt(second ?? first);
    if (!guildId || isNaN(ticketId)) return null;

    return { guildId, ticketId };
}

export class TicketsModule extends Base implements Initializable<never>, Messagable<true> {
    private ticketChannels: Set<string> = new Set();
    private TRANSCRIPTS_DIR: string = path.join(process.cwd(), 'data', 'transcripts');
    
    private transport: TicketTransport;

    constructor (bot: Bot) {
        super(bot);

        this.transport = new TicketTransport(bot);
    }

    async getTicketThread(guildId: string, channelId?: string): Promise<{ success: false, reason: string } | { success: true, reason: string, guild: Guild, channel: ForumChannel, thread: ForumThreadChannel }> {
        if (!channelId) return this.fail('NO_THREAD');
        
        const settings = await this.bot.settings.getGuildSettings(guildId);
        if (!settings) return this.fail('NOT_READY');

        const forum = settings.ticketForum;
        if (!forum) return this.fail('NOT_READY');
        
        const guild = this.bot.client.guilds.cache.get(guildId);
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

    async createTicket(guildId: string, userId: string, quickStart: QuickStart) {
        const activeTicket = await TicketRepository.getTicketUser(userId);

        if (activeTicket) return this.fail('ALREADY_OPEN');

        const settings = await this.bot.settings.getGuildSettings(guildId);
        if (!settings) return this.fail('NOT_READY');

        const ticketForum = settings.ticketForum;
        if (!ticketForum) return this.fail('NOT_READY');

        const guild = this.bot.client.guilds.cache.get(guildId);
        if (!guild) return this.fail('NO_GUILD');

        const channel = await guild.channels.fetch(ticketForum) as ForumChannel;
        if (!channel) return this.fail('NO_CHANNEL');

        const user = await this.bot.client.users.fetch(userId);
        const ticket = await TicketRepository.createTicket(guildId, userId, quickStart.caseId);

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
            const infraction = await this.bot.moderation.getCase(guildId, quickStart.caseId);

            if (!infraction) return this.fail('INVALID_CASE');

            embeds.push(TicketMessages.quickStartCaseEmbed(user, infraction));
        }
        if (quickStart.message) {
            embeds.push(TicketMessages.quickStartMessageEmbed(user, quickStart.message));
        }

        if (embeds.length) thread.send({ embeds });

        await TicketRepository.addChannelId(guildId, ticket!.ticketId!, thread.id);

        this.ticketChannels.add(thread.id);

        return this.success();
    }

    async getTicketByChannel(guildId: string, channelId: string) {
        return await TicketRepository.getTicketChannel(guildId, channelId);
    }

    async getTicketByUser(userId: string, guildId?: string) {
        const ticket = await TicketRepository.getTicketUser(userId);
        if (ticket && guildId && ticket.guildId != guildId) return null;

        return ticket;
    }

    async getTicketById(guildId: string, ticketId: number) {
        return await TicketRepository.getTicket(guildId, ticketId);
    }

    async closeTicket(userId: string, closedBy: string, guildId?: string) {
        const ticket = await this.getTicketByUser(userId, guildId);
        if (!ticket) return this.fail('NO_TICKET');

        const res = await this.getTicketThread(ticket.guildId, ticket.channelId!);
        if (!res.success) return res;

        const { thread } = res;

        if (ticket.status != 'open') return this.fail('ALREADY_CLOSED');

        await TicketRepository.closeTicket(ticket.guildId, ticket.ticketId!, closedBy);

        if (userId != closedBy) {
            this.transport.sendMessageUser(userId, TicketMessages.closedByAdminMessageDM());
        } else {
            thread.send(TicketMessages.closedByUserMessage(ticket));
        }

        return this.success();
    }

    async archiveTicket(guildId: string, ticketId: number) {
        const ticket = await TicketRepository.getTicket(guildId, ticketId);
        if (!ticket) return this.fail('NO_TICKET');

        const settings = await this.bot.settings.getGuildSettings(guildId);

        const res = await this.getTicketThread(guildId, ticket.channelId!);
        if (!res.success) return res;

        const { guild, thread } = res;

        const transcript = await this.generateTicketTranscript(thread);
        const transcriptName = `ticket-${guildId}-${ticket.userId}-${ticket.ticketId}.html`;

        if (settings && settings.transcriptChannel) {
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
            guildId,
            userId: ticket.userId,
            createdAt: ticket.createdAt,
        };

        await fs.writeFile(path.join(this.TRANSCRIPTS_DIR, 'meta', `ticket-${guildId}-${ticket.userId}-${ticket.ticketId}.json`), JSON.stringify(transcriptMetadata), {
            encoding: 'utf-8'
        });

        TicketRepository.archiveTicket(guildId, ticketId);

        await thread.setArchived(true, 'Ticket closed');

        this.ticketChannels.delete(ticket.channelId!);

        return this.success();
    }

    async reopenTicket(guildId: string, ticketId: number, reopenedBy: string, force: boolean) {
        const ticket = await TicketRepository.getTicket(guildId, ticketId);
        if (!ticket) return this.fail('NO_TICKET');

        if (ticket.status != 'closed') return this.fail(ticket.status == 'open' ? 'STILL_OPEN' : 'ARCHIVED');

        const res = await this.getTicketThread(guildId, ticket.channelId!);
        if (!res.success) return res;
        const { thread } = res;

        const adminClosed = ticket.closedBy != ticket.userId;
        const adminReopened = ticket.userId != reopenedBy;

        if ((adminClosed && adminReopened) || (!adminClosed && !adminReopened) || force) {
            await TicketRepository.reopenTicket(guildId, ticket.ticketId!);

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

    async getMutualGuilds(userId: string) {
        const guilds = [];
        for (const guild of this.bot.client.guilds.cache.values()) {
            const settings = await this.bot.settings.getGuildSettings(guild.id);
            if (!settings?.ticketForum) continue;
            if (await this.isUserBlocked(guild.id, userId)) continue;
            const member = await guild.members.fetch(userId).catch(() => null);
            if (member) guilds.push(guild);
        }

        return guilds;
    }

    async openTicketForUser(guildId: string, userId: string, quickStart: QuickStart): Promise<MessageCreateOptions> {
        if (await this.isUserBlocked(guildId, userId)) return TicketMessages.userBlocked();

        const guild = this.bot.client.guilds.cache.get(guildId);
        if (!guild) return TicketMessages.ticketCreationFailed(this.fail('NO_GUILD').reason);

        if (!quickStart.caseId && !(await guild.members.fetch(userId).catch(() => null))) {
            return TicketMessages.ticketCreationFailed(this.fail('NOT_MEMBER').reason);
        }

        const res = await this.createTicket(guildId, userId, quickStart);
        if (!res.success) return TicketMessages.ticketCreationFailed(res.reason);

        const ticket = await this.getTicketByUser(userId);
        if (!ticket) return TicketMessages.ticketCreationFailed(this.fail('NO_TICKET').reason);

        return TicketMessages.ticketCreated(ticket, guild, userId);
    }

    async onMessageDM(message: Message) {
        if (await this.bot.policy.hasUserOptedOutOfMessageContent(message.author.id)) {
            message.reply(TicketMessages.optedOut());
            return;
        }

        const ticket = await TicketRepository.getTicketUser(message.author.id);

        if (ticket) {
            if (ticket.status != 'open') {
                if (ticket.closedBy != message.author.id) {
                    message.reply(TicketMessages.ticketClosedByAdmin())
                } else {
                    message.reply(TicketMessages.ticketClosed(ticket))
                }
            } else {
                const res = await this.getTicketThread(ticket.guildId, ticket.channelId ?? undefined);
                if (!res.success) return;

                this.transport.sendMessageTicket(res.thread, message.author, message);
            }
        } else {
            message.reply(TicketMessages.openTicket(message.author, await this.getMutualGuilds(message.author.id)));
        }
    }

    async onMessage(message: Message) {
        if (!message.guildId) return this.onMessageDM(message);
    }

    async reply(guildId: string, channelId: string, content: string, files?: Attachment[]) {
        const ticket = await TicketRepository.getTicketChannel(guildId, channelId);
        if (!ticket) return this.fail('NO_TICKET');

        if (ticket.status != 'open') return this.fail('CLOSED');

        this.transport.sendReplyDM(ticket.userId, content, files ?? []);
    
        return this.success();
    }

    async sendMessage(message: Message<true>) {
        const ticket = await TicketRepository.getTicketChannel(message.guildId, message.channel.id);
        if (!ticket) return this.fail('NO_TICKET');

        if (ticket.status != 'open') return this.fail('CLOSED');

        this.transport.sendTicketDM(ticket.userId, message);
    
        return this.success();
    }

    async blockUser(guildId: string, userId: string) {
        await TicketRepository.blockUser(guildId, userId);
    }

    async unblockUser(guildId: string, userId: string) {
        await TicketRepository.unblockUser(guildId, userId);
    }

    async isUserBlocked(guildId: string, userId: string) {
        return !!(await TicketRepository.getUserBlock(guildId, userId));
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
            channelId: { $ne: null },
        }).lean();

        tickets.forEach(t => this.ticketChannels.add(t.channelId!));

        return true;
    }
}