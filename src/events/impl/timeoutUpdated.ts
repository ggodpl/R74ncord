import { AuditLogEvent, AutoModerationActionType, ButtonBuilder, ButtonStyle, Colors, ContainerBuilder, EmbedBuilder, GuildAuditLogsEntryExtraField, GuildMember, MessageFlags } from 'discord.js';
import { Bot } from '../../bot';
import { Event } from '../event';
import { Infraction } from '../../modules/moderation';
import { getRelativeTimestamp } from '../../utils/date';

export default class TimeoutUpdated extends Event<'guildMemberUpdate'> {
    constructor () {
        super({
            name: 'timeoutUpdated',
            event: 'guildMemberUpdate',
            once: false,
        });
    }

    async execute(bot: Bot, oldMember: GuildMember, newMember: GuildMember) {
        if (oldMember.communicationDisabledUntilTimestamp == newMember.communicationDisabledUntilTimestamp) return;

        const isTimedOut = !!newMember.communicationDisabledUntil;

        const { guild } = newMember;
        const auditLogs = await guild.fetchAuditLogs({
            limit: 10,
        });

        const AUTOMOD = AuditLogEvent.AutoModerationUserCommunicationDisabled;

        const entry = isTimedOut ? auditLogs.entries.find(e => 
            e.targetId == newMember.id 
            && [AUTOMOD, AuditLogEvent.MemberUpdate].includes(e.action)
            && (
                e.changes.some(c => c.key == 'communication_disabled_until' && c.new && new Date(c.new) > new Date())
                || (e.action == AUTOMOD && !e.changes)
            )
        ) : auditLogs.entries.find(e =>
            e.targetId == newMember.id
            && [AUTOMOD, AuditLogEvent.MemberUpdate].includes(e.action)
            && e.changes.some(c => c.key == 'communication_disabled_until' && c.old && (!c.new || new Date(c.new) < new Date()))
        );

        if (!entry) return;

        const isAutomod = entry.action == AUTOMOD;

        if (isAutomod) {
            const ruleName = (entry.extra as GuildAuditLogsEntryExtraField[typeof AUTOMOD]).autoModerationRuleName;
            const rule = guild.autoModerationRules.cache.find(r => r.name == ruleName);
            if (!rule) return;

            const action = rule.actions.find(a => a.type == AutoModerationActionType.Timeout);
            if (!action) return;

            if (action.metadata.durationSeconds <= 3600) return;
        }

        const infractionData: Infraction = {
            type: isTimedOut ? 'timeout' : 'untimeout',
            moderator: isAutomod ? undefined : entry.executorId,
            reason: entry.reason,
            duration: isTimedOut ? newMember.communicationDisabledUntilTimestamp - Date.now() : undefined,
            isAutomod,
        }

        const savedCase = await bot.moderation.registerInfraction(guild.id, newMember.id, infractionData);

        if (isTimedOut) {
            const dm = new ContainerBuilder()
                .addTextDisplayComponents(t => t.setContent(`You have been timed out for \`${entry.reason ?? 'No reason provided'}\` in **${newMember.guild.name}**. Your timeout expires ${getRelativeTimestamp(infractionData.duration)}`))
                .addSeparatorComponents(s => s)
                .addTextDisplayComponents(t => t.setContent('If you believe this is a mistake, you can press the button below to start a new ticket.'))
                .addActionRowComponents(r => r.setComponents(
                    new ButtonBuilder().setStyle(ButtonStyle.Danger).setLabel('Appeal').setCustomId(`ticket-open_${newMember.id}_${savedCase.caseId}`)
                ));
    
            try {
                await newMember.user.send({
                    components: [dm],
                    flags: [MessageFlags.IsComponentsV2],
                });
            } catch {};
        } else {
            const dm = new EmbedBuilder()
                .setTitle('Timeout removed')
                .setDescription(`Your timeout has been removed in **${newMember.guild.name}**`)
                .setColor(Colors.Green);
            
            try {
                await newMember.user.send({
                    embeds: [dm],
                });
            } catch {};
        }
    }
}
