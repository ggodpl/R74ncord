import { ChatInputCommandInteraction, Colors, EmbedBuilder, SlashCommandStringOption, SlashCommandUserOption } from 'discord.js';
import { Command, CommandPermissionLevel } from '../../command';
import { Bot } from '../../../bot';
import { Infraction } from '../../../modules/moderation';
import { getFooter } from '../../../utils/embed';

export default class Unban extends Command {
    constructor () {
        super({
            name: 'unban',
            description: 'Unbans the provided user',
            permissionLevel: CommandPermissionLevel.MOD,
            options: [
                new SlashCommandUserOption()
                    .setName('user')
                    .setDescription('User to unban')
                    .setRequired(true),
                new SlashCommandStringOption()
                    .setName('reason')
                    .setDescription('Reason for the unban')
                    .setRequired(false),
            ],
            isEphemeral: true,
            aliases: ['remove-ban'],
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction): Promise<void> {
        const user = command.options.getUser('user', true);
        const reason = command.options.getString('reason', false);

        const infraction: Infraction = {
            type: 'unban',
            reason,
            moderator: command.user.id,
        };


        await command.guild.bans.remove(user.id, reason ?? 'No reason provided');

        const savedCase = await bot.moderation.registerInfraction(command.guildId, user.id, infraction);

        const dm = new EmbedBuilder()
            .setTitle('Ban removed')
            .setDescription(`You have been unbanned in **${command.guild.name}**`)
            .setColor(Colors.Green);
        
        try {
            await user.send({
                embeds: [dm],
            });
        } catch {};

        const embed = new EmbedBuilder()
            .setTitle('Infraction')
            .setDescription(`\`${savedCase.caseId}\` | Unbanned user ${user} for \`${reason ?? 'No reason provided'}\``)
            .setColor(Colors.Green)
            .setFooter(getFooter(command.user.displayAvatarURL()));

        command.editReply({
            embeds: [embed]
        });
    }
}