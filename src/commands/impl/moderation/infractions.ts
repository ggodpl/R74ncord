import { ChatInputCommandInteraction, Colors, EmbedBuilder, SlashCommandBooleanOption, SlashCommandStringOption, SlashCommandUserOption } from 'discord.js';
import { Command, CommandPermissionLevel } from '../../command';
import { Bot } from '../../../bot';
import { getFooter } from '../../../utils/embed';

export default class Infractions extends Command {
    constructor () {
        super({
            name: 'infractions',
            description: "Gets user's infractions",
            permissionLevel: CommandPermissionLevel.CHAT_MOD,
            options: [
                new SlashCommandUserOption()
                    .setName('user')
                    .setDescription('User to get infractions for')
                    .setRequired(true)
            ],
            aliases: ['cases'],
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction): Promise<void> {
        const user = command.options.getUser('user', true);

        const infractions = await bot.moderation.getInfractions(command.guildId, user.id);

        if (!infractions.length) {
            const embed = new EmbedBuilder()
                .setTitle('Infractions')
                .setDescription(`This user has no infractions`)
                .setColor(0x00ffff)
                .setFooter(getFooter(command.user.displayAvatarURL()));

            command.editReply({
                embeds: [embed]
            });
            return;
        }

        const infractionStrings = infractions.map(i => `\`${i.caseId}\` | **${i.infractionType}**\n${i.reason ?? 'No reason provided'}`);

        const warns = infractions.filter(i => i.infractionType == 'warn').length;
        const timeouts = infractions.filter(i => i.infractionType == 'timeout').length;
        const kicks = infractions.filter(i => i.infractionType == 'kick').length;
        const softbans = infractions.filter(i => i.infractionType == 'softban').length;
        const bans = infractions.filter(i => i.infractionType == 'ban').length;

        const embed = new EmbedBuilder()
            .setTitle('Infractions')
            .setDescription(infractionStrings.join('\n'))
            .setColor(0x00ffff)
            .setFooter({
                text: `Warns: ${warns} | Timeouts: ${timeouts} | Kicks: ${kicks} | Soft-bans: ${softbans} | Bans: ${bans}`,
                iconURL: command.user.displayAvatarURL()
            });

        command.editReply({
            embeds: [embed]
        });
    }
}