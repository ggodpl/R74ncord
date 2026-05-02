import { ChatInputCommandInteraction, Colors, EmbedBuilder, SlashCommandStringOption, SlashCommandUserOption } from 'discord.js';
import { Command, CommandPermissionLevel } from '../../command';
import { Bot } from '../../../bot';
import { Infraction } from '../../../modules/moderation';
import { getFooter } from '../../../utils/embed';
import ms, { StringValue } from 'ms';

export default class SoftBan extends Command {
    constructor () {
        super({
            name: 'soft-ban',
            description: 'Soft-bans the provided user. Soft-bans unban immediately after banning, which let\'s you quickly purge last user messages, while still letting them rejoin afterwards.',
            permissionLevel: CommandPermissionLevel.MOD,
            options: [
                new SlashCommandUserOption()
                    .setName('user')
                    .setDescription('User to soft-ban')
                    .setRequired(true),
                new SlashCommandStringOption()
                    .setName('reason')
                    .setDescription('Reason for the soft-ban')
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
        const reason = command.options.getString('reason', false);
        const purgeMessages = command.options.getString('purge-messages', false);

        const infraction: Infraction = {
            type: 'softban',
            reason,
            moderator: command.user.id,
        };

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

        const dm = new EmbedBuilder()
            .setTitle('Soft-ban')
            .setDescription(`You have been soft-banned for \`${reason ?? 'No reason provided'}\` from **${command.guild.name}**. You *can* rejoin the server`)
            .setColor(Colors.DarkOrange);
        
        try {
            await user.send({
                embeds: [dm],
            });
        } catch {};

        await command.guild.members.ban(user.id, banOptions);

        const savedCase = await bot.moderation.registerInfraction(command.guildId, user.id, infraction);

        const embed = new EmbedBuilder()
            .setTitle('Infraction')
            .setDescription(`\`${savedCase.caseId}\` | Soft-banned ${user} for \`${reason ?? 'No reason provided'}\``)
            .setColor(Colors.DarkOrange)
            .setFooter(getFooter(command.user.displayAvatarURL()));

        command.editReply({
            embeds: [embed]
        });
    }
}