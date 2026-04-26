import { ChatInputCommandInteraction, Colors, EmbedBuilder, SlashCommandStringOption, SlashCommandUserOption } from 'discord.js';
import { Command, CommandPermissionLevel } from '../../command';
import { Bot } from '../../../bot';
import { Infraction } from '../../../modules/moderation';
import { getFooter } from '../../../utils/embed';
import ms, { StringValue } from 'ms';
import { getRelativeTimestamp } from '../../../utils/date';

export default class Timeout extends Command {
    constructor () {
        super({
            name: 'timeout',
            description: 'Times the provided user out',
            permissionLevel: CommandPermissionLevel.CHAT_MOD,
            options: [
                new SlashCommandUserOption()
                    .setName('user')
                    .setDescription('User to time out')
                    .setRequired(true),
                new SlashCommandStringOption()
                    .setName('duration')
                    .setDescription('Duration for the timeout (e.g. 1h, 7d, 5m')
                    .setRequired(true),
                new SlashCommandStringOption()
                    .setName('reason')
                    .setDescription('Reason for the timeout')
                    .setRequired(false),
            ],
            isEphemeral: true,
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction): Promise<void> {
        const user = command.options.getUser('user', true);
        const duration = command.options.getString('duration', true);
        const reason = command.options.getString('reason', false);
    
        const durationMs = ms(duration as StringValue);
        if (Number.isNaN(durationMs)) {
            command.editReply('Invalid duration format. Use an ms-supported duration (e.g. `5s`, `7h` or `1 day`. For more information visit https://github.com/vercel/ms/blob/main/README.md')
            return;
        }

        const infraction: Infraction = {
            type: 'timeout',
            reason,
            moderator: command.user.id,
            duration: durationMs,
        };

        const member = await command.guild.members.fetch({
            user: user.id
        });

        await member.timeout(durationMs, reason ?? 'No reason provided');

        const savedCase = await bot.moderation.registerInfraction(command.guildId, user.id, infraction);

        const dm = new EmbedBuilder()
            .setTitle('Timeout')
            .setDescription(`You have been timed out for \`${reason ?? 'No reason provided'}\` in **${command.guild.name}**. Your timeout expires ${getRelativeTimestamp(durationMs)}`)
            .setColor(Colors.Orange);
        
        try {
            await user.send({
                embeds: [dm],
            });
        } catch {};

        const embed = new EmbedBuilder()
            .setTitle('Infraction')
            .setDescription(`\`${savedCase.caseId}\` | Timed ${user} out for \`${reason ?? 'No reason provided'}\` | Expires ${getRelativeTimestamp(durationMs)}`)
            .setColor(Colors.Orange)
            .setFooter(getFooter(command.user.displayAvatarURL()));

        command.editReply({
            embeds: [embed]
        });
    }
}