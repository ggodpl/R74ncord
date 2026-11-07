import { Colors, EmbedBuilder, Guild, TextChannel, User } from 'discord.js';
import { Base } from '../base';
import Infractions from '../mongodb/models/Infractions';
import { getFooter } from '../utils/embed';
import ms from 'ms';
import Notes from '../mongodb/models/Notes';

export interface Infraction {
    type: 'warn' | 'timeout' | 'kick' | 'softban' | 'ban' | 'untimeout' | 'unban';
    reason?: string | null;
    moderator?: string;
    duration?: number;
    isAutomod?: boolean;
}

export class ModerationModule extends Base {
    debouncedPunishments: Map<string, number> = new Map();

    async getInfractions(guildId: string, userId: string) {
        return await Infractions.find({
            guildId,
            userId
        }).lean();
    }

    async getNotes(guildId: string, userId: string) {
        return await Notes.find({
            guildId,
            userId,
        }).lean();
    }

    async getCase(guildId: string, caseId: number) {
        return await Infractions.findOne({
            guildId,
            caseId
        });
    }

    async getNote(guildId: string, noteId: number) {
        return await Notes.findOne({
            guildId,
            noteId,
        });
    }

    async removeCase(guildId: string, caseId: number) {
        return await Infractions.findOneAndDelete({
            guildId,
            caseId
        });
    }

    async strikeNote(guildId: string, noteId: number) {
        await Notes.updateOne({
            guildId,
            noteId,
        }, {
            stricken: true,
        });
    }

    async registerInfraction(guildId: string, userId: string, infraction: Infraction) {
        if (this.debouncedPunishments.has(`${guildId}_${userId}_${infraction.type}`)) {
            const punishment = this.debouncedPunishments.get(`${guildId}_${userId}_${infraction.type}`);
            if (punishment && punishment + 2000 > Date.now()) return;
        }

        const savedCase = await Infractions.create({
            guildId,
            userId,
            infractionType: infraction.type,
            reason: infraction.reason,
            moderator: infraction.moderator,
            duration: infraction.duration,
            isAutomod: infraction.isAutomod,
        });

        const settings = await this.bot.settings.getGuildSettings(guildId);

        if (settings?.modlog) {
            const fields = [
                { name: 'Type', value: `\`${infraction.type}\`` },
                { name: 'Target', value: `<@${userId}>` },
                { name: 'Moderator', value: infraction.isAutomod ? '`Automod`' : `<@${infraction.moderator}>` },
                { name: 'Reason', value: `\`${infraction.reason ?? 'No reason provided'}\`` },
                { name: 'Case ID', value: `\`${savedCase.caseId ?? 0}\`` },
            ];
            
            if (infraction.duration) {
                fields.push({ name: 'Duration', value: `\`${ms(infraction.duration)}\`` });
            }

            const embed = new EmbedBuilder()
                .setTitle('New infraction')
                .addFields(fields)
                .setColor(['untimeout', 'unban'].includes(infraction.type) ? Colors.Green : Colors.Red)
                .setFooter(getFooter());

            const guild = this.bot.client.guilds.cache.get(guildId);
            if (!guild) return;

            const channel = guild.channels.cache.get(settings.modlog);
            if (!channel) return;
    
            try {
                (channel as TextChannel).send({
                    embeds: [embed]
                });
            } catch {};
        }

        this.debouncedPunishments.set(`${guildId}_${userId}_${infraction.type}`, Date.now());

        this.cleanup();

        return savedCase;
    }

    async note(guildId: string, userId: string, note: string) {
        const savedNote = await Notes.create({
            guildId,
            userId,
            note,
        });
        
        const settings = await this.bot.settings.getGuildSettings(guildId);
        
        if (settings?.modlog) {
            const embed = new EmbedBuilder()
                .setTitle('New note')
                .addFields({
                    name: 'Note ID',
                    value: `${savedNote.noteId}`,
                }, {
                    name: 'Target',
                    value: `<@${userId}>`,
                }, {
                    name: 'Note',
                    value: `${note}`,
                })
                .setColor(Colors.Blue)
                .setFooter(getFooter());
            
            const guild = this.bot.client.guilds.cache.get(guildId);
            if (!guild) return;

            const channel = guild.channels.cache.get(settings.modlog);
            if (!channel) return;
    
            try {
                (channel as TextChannel).send({
                    embeds: [embed]
                });
            } catch {};
        }

        return savedNote;
    }

    cleanup() {
        for (const [key, value] of this.debouncedPunishments.entries()) {
            if (value + 2000 < Date.now()) this.debouncedPunishments.delete(key);
        }
    }
}