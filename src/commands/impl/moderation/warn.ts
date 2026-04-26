import { ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Colors, ContainerBuilder, EmbedBuilder, MessageFlags, SlashCommandStringOption, SlashCommandUserOption } from 'discord.js';
import { Command, CommandPermissionLevel } from '../../command';
import { Bot } from '../../../bot';
import { Infraction } from '../../../modules/moderation';
import { getFooter } from '../../../utils/embed';
import { getRelativeTimestamp } from '../../../utils/date';

export default class Warn extends Command {
    constructor () {
        super({
            name: 'warn',
            description: 'Warns the provided user',
            permissionLevel: CommandPermissionLevel.CHAT_MOD,
            options: [
                new SlashCommandUserOption()
                    .setName('user')
                    .setDescription('User to warn')
                    .setRequired(true),
                new SlashCommandStringOption()
                    .setName('reason')
                    .setDescription('Reason for the warn')
                    .setRequired(false),
            ],
            isEphemeral: true,
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction): Promise<void> {
        const user = command.options.getUser('user', true);
        const reason = command.options.getString('reason', false);
    
        const infraction: Infraction = {
            type: 'warn',
            reason,
            moderator: command.user.id,
        };

        const savedCase = await bot.moderation.registerInfraction(command.guildId, user.id, infraction);

        const dm = new ContainerBuilder()
            .setAccentColor(Colors.Yellow)
            .addTextDisplayComponents(t => t.setContent(`You have been warned for \`${reason ?? 'No reason provided'}\` in **${command.guild.name}**`))
            .addSeparatorComponents(s => s)
            .addActionRowComponents(r => r.setComponents(
                new ButtonBuilder().setLabel('Appeal').setCustomId('appeal').setStyle(ButtonStyle.Danger)
            ));
        // const dm = new EmbedBuilder()
        //     .setTitle('Warn')
        //     .setDescription(`You have been warned for \`${reason ?? 'No reason provided'}\` in **${command.guild.name}**`)
        //     .setColor(Colors.Yellow);
        
        try {
            await user.send({
                components: [dm],
                flags: [MessageFlags.IsComponentsV2]
            });
        } catch {};

        const embed = new EmbedBuilder()
            .setTitle('Infraction')
            .setDescription(`\`${savedCase.caseId}\` | Warned ${user} for \`${reason ?? 'No reason provided'}\``)
            .setColor(Colors.Yellow)
            .setFooter(getFooter(command.user.displayAvatarURL()));

        command.editReply({
            embeds: [embed]
        });
    }
}