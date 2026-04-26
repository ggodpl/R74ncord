import { ChatInputCommandInteraction, Colors, EmbedBuilder, SlashCommandIntegerOption } from 'discord.js';
import { Command, CommandPermissionLevel } from '../../command';
import { Bot } from '../../../bot';
import { getFooter } from '../../../utils/embed';

export default class Case extends Command {
    constructor () {
        super({
            name: 'case',
            description: 'Displays info about a specific case',
            permissionLevel: CommandPermissionLevel.CHAT_MOD,
            options: [
                new SlashCommandIntegerOption()
                    .setName('case')
                    .setDescription('Case to display')
                    .setRequired(true)
                    .setMinValue(0)
            ],
            aliases: ['infraction']
        })
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction): Promise<void> {
        const caseId = command.options.getInteger('case', true);

        const caseData = await bot.moderation.getCase(command.guildId, caseId);

        if (!caseData) {
            const embed = new EmbedBuilder()
                .setTitle(`Case ${caseId}`)
                .setDescription(`Case \`${caseId}\` does not exist`)
                .setColor(Colors.Red)
                .setFooter(getFooter(command.user.displayAvatarURL()));

            command.editReply({
                embeds: [embed]
            });

            return;
        }

        const fields = [
            { name: 'Type', value: `\`${caseData.infractionType}\`` },
            { name: 'Moderator', value: `<@${caseData.moderator}>` },
            { name: 'Reason', value: caseData.reason },
            { name: 'Case ID', value: `${caseData.caseId}` },
        ];

        if (caseData.duration) {
            fields.push({ name: 'Duration', value: `${caseData.duration}` });
        }

        const embed = new EmbedBuilder()
            .setTitle(`Case ${caseId}`)
            .addFields(fields)
            .setColor(0x00ffff)
            .setFooter(getFooter(command.user.displayAvatarURL()));

        command.editReply({
            embeds: [embed],
        });
    }
}