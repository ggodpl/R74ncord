import { Colors, EmbedBuilder, TextChannel } from 'discord.js';
import { Base } from '../base';
import Infractions from '../mongodb/models/Infractions';
import { getFooter } from '../utils/embed';
import ms from 'ms';

export interface Infraction {
    type: 'warn' | 'timeout' | 'kick' | 'softban' | 'ban' | 'untimeout' | 'unban',
    reason?: string,
    moderator: string,
    duration?: number
}

export class ModerationModule extends Base {
    async getInfractions(guildId: string, userId: string) {
        return await Infractions.find({
            guildId,
            userId
        }).lean();
    }

    async getCase(guildId: string, caseId: number) {
        return await Infractions.findOne({
            guildId,
            caseId
        });
    }

    async removeCase(guildId: string, caseId: number) {
        return await Infractions.findOneAndDelete({
            guildId,
            caseId
        });
    }

    async registerInfraction(guildId: string, userId: string, infraction: Infraction) {
        const savedCase = await Infractions.create({
            guildId,
            userId,
            infractionType: infraction.type,
            reason: infraction.reason,
            moderator: infraction.moderator,
            duration: infraction.duration
        });

        const settings = await this.bot.settings.getGuildSettings(guildId);

        if (settings?.modlog) {
            const fields = [
                { name: 'Type', value: `\`${infraction.type}\`` },
                { name: 'Target', value: `<@${userId}>` },
                { name: 'Moderator', value: `<@${infraction.moderator}>` },
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
    
            (channel as TextChannel).send({
                embeds: [embed]
            });
        }

        return savedCase;
    }
}