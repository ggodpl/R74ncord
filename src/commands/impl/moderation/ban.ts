import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Colors, ContainerBuilder, EmbedBuilder, SlashCommandStringOption, SlashCommandUserOption, TextInputBuilder } from 'discord.js';
import { Command, CommandPermissionLevel } from '../../command';
import { Bot } from '../../../bot';
import { Infraction } from '../../../modules/moderation';
import { getFooter } from '../../../utils/embed';
import ms, { StringValue } from 'ms';
import { getRelativeTimestamp } from '../../../utils/date';
import UnbanTask from '../../../tasks/impl/unban';

export default class Ban extends Command {
    constructor () {
        super({
            name: 'ban',
            description: 'Bans the provided user',
            permissionLevel: CommandPermissionLevel.MOD,
            options: [
                new SlashCommandUserOption()
                    .setName('user')
                    .setDescription('User to ban')
                    .setRequired(true),
                new SlashCommandStringOption()
                    .setName('duration')
                    .setDescription('Duration for the ban')
                    .setRequired(false),
                new SlashCommandStringOption()
                    .setName('reason')
                    .setDescription('Reason for the ban')
                    .setRequired(false),
                new SlashCommandStringOption()
                    .setName('purge-messages')
                    .setDescription('How much of the message history to delete (e.g. `7d`, `1h`, `none`, `0`). Optional')
                    .setRequired(false)
            ],
            isEphemeral: true,
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction): Promise<void> {
        const user = command.options.getUser('user', true);
        const duration = command.options.getString('duration', false);
        const reason = command.options.getString('reason', false);
        const purgeMessages = command.options.getString('purge-messages', false);

        const infraction: Infraction = {
            type: 'ban',
            reason,
            moderator: command.user.id,
        };
        let isTemp = false;

        const banOptions = {
            reason: reason ?? 'No reason provided'
        };

        if (purgeMessages && !['0', 'none'].includes(purgeMessages.toLowerCase())) {
            const purgeMs = ms(purgeMessages as StringValue);
            if (typeof purgeMs !== 'number' || purgeMs < 0) {
                await command.editReply('Invalid purge duration format.');
                return;
            }

            const deleteMessageSeconds = Math.floor(purgeMs / 1000);
            if (deleteMessageSeconds > 604800) {
                await command.editReply('You cannot delete more than 7 days of message history.');
                return;
            }

            banOptions['deleteMessageSeconds'] = deleteMessageSeconds;
        }

        let durationMs: number | undefined;

        if (duration) {
            const parsed = ms(duration as StringValue);
            if (typeof parsed !== 'number' || parsed <= 0) {
                await command.editReply('Invalid ban duration format.');
                return;
            }

            durationMs = parsed;

            bot.scheduler.schedule(new UnbanTask({
                userId: user.id,
                guildId: command.guildId
            }), durationMs);

            infraction.duration = durationMs;
            isTemp = true;
        }

        const savedCase = await bot.moderation.registerInfraction(command.guildId, user.id, infraction);

        const dm = new EmbedBuilder()
            .setTitle('Ban')
            .setDescription(`You have been banned for \`${reason ?? 'No reason provided'}\` from **${command.guild.name}**${isTemp ? `| Expires ${getRelativeTimestamp(durationMs)}` : ''}`)
            .setColor(Colors.DarkRed);
        
        const dmRow = new ActionRowBuilder()
            .setComponents(
                new ButtonBuilder().setLabel('Appeal').setCustomId(`appeal-${savedCase.caseId}`).setStyle(ButtonStyle.Danger),
            );
        
        try {
            await user.send({
                embeds: [dm],
                components: [dmRow.toJSON()],
            });
        } catch {};

        await command.guild.members.ban(user.id, banOptions);

        const embed = new EmbedBuilder()
            .setTitle('Infraction')
            .setDescription(`\`${savedCase.caseId}\` | Banned ${user} for \`${reason ?? 'No reason provided'}\``)
            .setColor(Colors.DarkRed)
            .setFooter(getFooter(command.user.displayAvatarURL()));

        command.editReply({
            embeds: [embed]
        });
    }
}