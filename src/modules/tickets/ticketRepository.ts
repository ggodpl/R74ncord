import TicketBlocks from '../../mongodb/models/TicketBlocks';
import Tickets from '../../mongodb/models/Tickets';

export class TicketRepository {
    static async createTicket(guildId: string, userId: string, caseId?: number) {
        return await Tickets.create({
            guildId,
            userId,
            caseId,
        });
    }

    static async addChannelId(guildId: string, ticketId: number, channelId: string) {
        await Tickets.updateOne({
            guildId,
            ticketId
        }, {
            channelId
        });
    }

    static async getTicket(guildId: string, ticketId: number) {
        return await Tickets.findOne({
            guildId,
            ticketId
        });
    }

    static async getTicketChannel(guildId: string, channelId: string) {
        return await Tickets.findOne({
            guildId,
            channelId
        });
    }

    static async getTicketUser(guildId: string, userId: string) {
        return await Tickets.findOne({
            guildId,
            userId,
            status: { $ne: 'archived' },
        });
    }

    static async closeTicket(guildId: string, ticketId: number, closedBy: string) {
        await Tickets.updateOne({
            guildId,
            ticketId
        }, {
            status: 'closed',
            closedBy
        });
    }

    static async reopenTicket(guildId: string, ticketId: number) {
        await Tickets.updateOne({
            guildId,
            ticketId
        }, {
            status: 'open',
            closedBy: null
        });
    }
    
    static async archiveTicket(guildId: string, ticketId: number) {
        await Tickets.updateOne({
            guildId,
            ticketId
        }, {
            status: 'archived',
            closedBy: null
        });
    }

    static async blockUser(guildId: string, userId: string) {
        await TicketBlocks.findOneAndUpdate({
            guildId,
            userId
        }, {}, {
            upsert: true
        });
    }

    static async unblockUser(guildId: string, userId: string) {
        await TicketBlocks.deleteOne({
            guildId,
            userId
        });
    }

    static async getUserBlock(guildId: string, userId: string) {
        return await TicketBlocks.findOne({
            guildId,
            userId
        });
    }
}