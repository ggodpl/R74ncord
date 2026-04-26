import { ButtonBuilder, ButtonStyle, ChannelType, Colors, ContainerBuilder, EmbedBuilder, ForumChannel, Message, MessageFlags } from 'discord.js';
import { Base, Initializable } from '../base';
import Tickets from '../mongodb/models/Tickets';
import ms from 'ms';
import { getFooter } from '../utils/embed';

export interface QuickStart {
    caseId?: number;
    message?: string;
}

const GUILD_ID = process.env['BASE_TICKET_GUILD']!;

export class TicketsModule extends Base implements Initializable<never> {
    private ticketChannels: Set<string> = new Set();

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

        const starterMessage = (settings.ticketStarterMessage ?? '%user opened a new ticket').replace('%user', `<@${userId}>`).replace('%username', user.username);

        const embeds = [];

        const starterComponent = new ContainerBuilder()
            .setAccentColor(0x00ffff)
            .addTextDisplayComponents(t => t.setContent(`${user} (\`${user.username}\`} created a new ticket. You can use this channel to discuss this case with other moderators.\nTo reply, use the /reply command. The user will not see your username.\nYou can close the ticket using buttons below, or by using the /ticket-close command.\n`))
            .addSeparatorComponents(s => s)
            .addActionRowComponents(r => r.setComponents(
                new ButtonBuilder().setLabel('Lock ticket').setStyle(ButtonStyle.Secondary).setCustomId('lock'),
                new ButtonBuilder().setLabel('Close ticket').setStyle(ButtonStyle.Danger).setCustomId('close'),
                new ButtonBuilder().setLabel('Block user').setStyle(ButtonStyle.Danger).setCustomId('block'),
                new ButtonBuilder().setLabel('Some other option').setStyle(ButtonStyle.Success).setCustomId('other'),
            ))
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
        
        if (quickStart.message) {
            const messageEmbed = new EmbedBuilder()
                .setTitle(`${user.username} says...`)
                .setDescription(quickStart.message)
                .setColor(0xffffff)
                .setFooter(getFooter(user.displayAvatarURL()));
            
            thread.send({ embeds: [messageEmbed] });
        }

        await Tickets.create({
            guildId: GUILD_ID,
            userId,
            channelId: thread.id,
            caseId: quickStart.caseId,
        });

        this.ticketChannels.add(thread.id);

        return {
            success: true,
            reason: ''
        }
    }

    async closeTicket() {

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

    async sendTicketMessage(userId: string, message: string, channelId: string) {
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
            content: message,
            allowedMentions: { parse: [] },
        });
    }

    async sendTicketDM(userId: string, message: string) {
        const user = await this.bot.client.users.fetch(userId);
        if (!user) return;

        user.send({
            content: message,
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
            this.sendTicketMessage(message.author.id, message.content, ticket.channelId);
        }
    }

    async onMessage(message: Message) {
        if (!message.guildId) this.onBotMessaged(message);
        else if (this.ticketChannels.has(message.channelId)) {
            const ticket = await Tickets.findOne({
                channelId: message.channelId,
            });

            if (!ticket) return;

            this.sendTicketDM(ticket.userId, message.content);            
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