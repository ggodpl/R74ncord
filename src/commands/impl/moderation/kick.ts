import { ChatInputCommandInteraction, Colors, EmbedBuilder, SlashCommandStringOption, SlashCommandUserOption } from 'discord.js';
import { Command, CommandPermissionLevel } from '../../command';
import { Bot } from '../../../bot';
import { Infraction } from '../../../modules/moderation';
import { getFooter } from '../../../utils/embed';

export default class Kick extends Command {
    constructor () {
        super({
            name: 'kick',
            description: 'Kicks the provided user',
            permissionLevel: CommandPermissionLevel.MOD,
            options: [
                new SlashCommandUserOption()
                    .setName('user')
                    .setDescription('User to kick')
                    .setRequired(true),
                new SlashCommandStringOption()
                    .setName('reason')
                    .setDescription('Reason for the kick')
                    .setRequired(false),
            ],
            isEphemeral: true,
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction): Promise<void> {
        const user = command.options.getUser('user', true);
        const reason = command.options.getString('reason', false);

        const infraction: Infraction = {
            type: 'kick',
            reason,
            moderator: command.user.id,
        };

        const member = await command.guild.members.fetch({
            user: user.id
        });

        const dm = new EmbedBuilder()
            .setTitle('Kick')
            .setDescription(`You have been kicked for \`${reason ?? 'No reason provided'}\` from **${command.guild.name}**`)
            .setColor(Colors.Red);
        
        try {
            await user.send({
                embeds: [dm],
            });
        } catch {};

        await member.kick(reason ?? 'No reason provided');

        const savedCase = await bot.moderation.registerInfraction(command.guildId, user.id, infraction);

        const embed = new EmbedBuilder()
            .setTitle('Infraction')
            .setDescription(`\`${savedCase.caseId}\` | Kicked ${user} for \`${reason ?? 'No reason provided'}\``)
            .setColor(Colors.Red)
            .setFooter(getFooter(command.user.displayAvatarURL()));

        command.editReply({
            embeds: [embed]
        });
    }
}