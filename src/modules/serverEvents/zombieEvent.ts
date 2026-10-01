import { Message, MessageReaction, MessageReferenceType, User } from 'discord.js';
import { Base, Messagable, Reactable } from '../../base';
import { Bot } from '../../bot';
import Zombie_GuildSettings from '../../mongodb/models/serverEvents/Zombie_GuildSettings';
import Zombie_InfectedUsers from '../../mongodb/models/serverEvents/Zombie_InfectedUsers';

class ZombieEventRepository {
    static async getEventSettings(guildId: string) {
        return await Zombie_GuildSettings.findOne({
            guildId,
        }).lean();
    }

    static async setEventSettings(guildId: string, infectedRole: string, endsAt: number) {
        await Zombie_GuildSettings.updateOne({
            guildId,
        }, {
            $setOnInsert: {
                running: false,
            },
            infectedRole,
            endsAt,
        }, {
            upsert: true,
        });
    }

    static async startEvent(guildId: string) {
        if (!(await this.getEventSettings(guildId))) return;

        await Zombie_GuildSettings.updateOne({
            guildId,
        }, {
            running: true,
            startedAt: Date.now(),
        });
    }

    static async isUserInfected(guildId: string, userId: string) {
        const user = await Zombie_InfectedUsers.findOne({
            guildId,
            userId,
        }).lean();

        return !!user;
    }

    static async addUserInfected(guildId: string, userId: string, infectedBy: string) {
        await Zombie_InfectedUsers.updateOne({
            guildId,
            userId,
        }, {
            $setOnInsert: {
                infectedBy,
            },
        }, {
            upsert: true,
        });
    }
}

export class ZombieEventModule extends Base implements Messagable<true>, Reactable {
    repository = ZombieEventRepository;
    infectedUsers: Map<string, Set<string>> = new Map();
    eventSettings: Map<string, {
        running: boolean,
        infectedRole: string,
        endsAt: number,
        startedAt: number | undefined,
    }> = new Map();

    constructor (bot: Bot) {
        super(bot);
    }

    async startEvent(guildId: string) {
        const settings = await this.getEventSettings(guildId);
        if (!settings) return false;

        await this.repository.startEvent(guildId);

        settings.running = true;
        return true;
    }

    async refreshGuild(guildId: string) {
        this.eventSettings.delete(guildId);
        await this.getEventSettings(guildId);
    }

    async infectUser(guildId: string, userId: string, infectedBy: string) {
        const cache = this.getGuildCache(guildId)!;
        if (cache.has(userId)) return;

        const settings = await this.getEventSettings(guildId);
        if (!settings) return;

        try {
            const guild = await this.bot.client.guilds.fetch(guildId);
            const member = await guild.members.fetch(userId);
            await member.roles.add(settings.infectedRole);

            await this.repository.addUserInfected(guildId, userId, infectedBy);
            cache.add(userId);
        } catch (error) {
            console.error('Unable to infect user: ', error);
        }
    }

    getGuildCache(guildId: string) {
        if (!this.infectedUsers.has(guildId)) this.infectedUsers.set(guildId, new Set());
        return this.infectedUsers.get(guildId);
    }

    async isInfected(guildId: string, userId: string) {
        const cache = this.getGuildCache(guildId)!;
        if (cache.has(userId)) return true;

        const isInfected = await this.repository.isUserInfected(guildId, userId);
        if (isInfected) cache.add(userId);

        return isInfected;
    }

    async getEventSettings(guildId: string) {
        if (this.eventSettings.has(guildId)) return this.eventSettings.get(guildId);

        const eventSettings = await this.repository.getEventSettings(guildId);
        if (!eventSettings) return undefined;

        this.eventSettings.set(guildId, {
            running: eventSettings.running,
            infectedRole: eventSettings.infectedRole,
            endsAt: eventSettings.endsAt.getTime(),
            startedAt: eventSettings.startedAt?.getTime(),
        });

        return this.eventSettings.get(guildId);
    }

    async isEventRunning(guildId: string) {
        const settings = await this.getEventSettings(guildId);

        console.log(!!settings, settings?.running, (settings?.endsAt ?? 0) > Date.now());
        return !!settings && settings.running && settings.endsAt > Date.now();
    }

    async onMessage(message: Message<true>) {
        if (!message.reference || message.reference.type !== MessageReferenceType.Default) return;
        if (!(await this.isEventRunning(message.guildId))) return;
        if (!(await this.isInfected(message.guildId, message.author.id))) return;

        const eventSettings = await this.getEventSettings(message.guildId)!;
        if (!eventSettings) return;
        if (!eventSettings.startedAt) return;
        if ((message.createdTimestamp < eventSettings.startedAt) || (message.createdTimestamp < Date.now() - (1000 * 60 * 60 * 24 * 5))) return;

        const original = await message.fetchReference();
        if (original.author.id === message.author.id) return;

        await this.infectUser(message.guildId, original.author.id, message.author.id);
    }

    async onReact(messageReaction: MessageReaction, user: User) {
        const { message } = messageReaction;
        const fullMessage = await message.fetch();
        console.log('reaction added')
        if (!fullMessage.inGuild()) return;
        console.log('in guild');
        if (messageReaction.emoji.name !== '🧠') return;
        console.log('brain reaction');
        if (!(await this.isEventRunning(fullMessage.guildId))) return;
        console.log('event running');
        if (!(await this.isInfected(fullMessage.guildId, user.id))) return;
        console.log('user infected');

        const eventSettings = await this.getEventSettings(fullMessage.guildId)!;
        if (!eventSettings) return;
        console.log('settings found');
        if (!eventSettings.startedAt) return;
        console.log('event started');
        if ((fullMessage.createdTimestamp < eventSettings.startedAt) || (fullMessage.createdTimestamp < Date.now() - (1000 * 60 * 60 * 24 * 5))) {
            console.log(fullMessage.createdTimestamp < eventSettings.startedAt);
            console.log(fullMessage.createdTimestamp < Date.now() - (1000 * 60 * 60 * 24 * 5));
            return;
        }
        console.log('message valid');

        if (fullMessage.author.id === user.id) return;

        await this.infectUser(fullMessage.guildId, fullMessage.author.id, user.id);
    }
}