import { ChatInputCommandInteraction, Colors, EmbedBuilder, SlashCommandStringOption, SlashCommandUserOption } from 'discord.js';
import { Command, CommandPermissionLevel } from '../../command';
import { Bot } from '../../../bot';
import { Infraction } from '../../../modules/moderation';
import { getFooter } from '../../../utils/embed';

export default class Untimeout extends Command {
    constructor () {
        super({
            name: 'untimeout',
            description: 'Removes the timeout from the provided user',
            permissionLevel: CommandPermissionLevel.CHAT_MOD,
            options: [
                new SlashCommandUserOption()
                    .setName('user')
                    .setDescription('User to remove the timeout from')
                    .setRequired(true),
                new SlashCommandStringOption()
                    .setName('reason')
                    .setDescription('Reason for the timeout removal')
                    .setRequired(false),
            ],
            isEphemeral: true,
            aliases: ['remove-timeout'],
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction): Promise<void> {
        const user = command.options.getUser('user', true);
        const reason = command.options.getString('reason', false);

        const infraction: Infraction = {
            type: 'untimeout',
            reason,
            moderator: command.user.id,
        };

        const member = await command.guild.members.fetch({
            user: user.id
        });

        await member.disableCommunicationUntil(null, reason ?? 'No reason provided');

        const savedCase = await bot.moderation.registerInfraction(command.guildId, user.id, infraction);

        const dm = new EmbedBuilder()
            .setTitle('Timeout removed')
            .setDescription(`Your timeout has been removed in **${command.guild.name}**`)
            .setColor(Colors.Green);
        
        try {
            await user.send({
                embeds: [dm],
            });
        } catch {};

        const embed = new EmbedBuilder()
            .setTitle('Infraction')
            .setDescription(`\`${savedCase.caseId}\` | Removed timeout from ${user} for \`${reason ?? 'No reason provided'}\``)
            .setColor(Colors.Green)
            .setFooter(getFooter(command.user.displayAvatarURL()));

        command.editReply({
            embeds: [embed]
        });
    }
}