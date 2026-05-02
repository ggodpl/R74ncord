import { ChatInputCommandInteraction, Colors, EmbedBuilder, SlashCommandIntegerOption } from 'discord.js';
import { Command, CommandPermissionLevel } from '../../command';
import { Bot } from '../../../bot';
import { getFooter } from '../../../utils/embed';

export default class RemoveCase extends Command {
    constructor () {
        super({
            name: 'remove-case',
            description: 'Removes a specific case',
            permissionLevel: CommandPermissionLevel.MOD,
            options: [
                new SlashCommandIntegerOption()
                    .setName('case')
                    .setDescription('Case to remove')
                    .setRequired(true)
                    .setMinValue(0)
            ],
            aliases: ['delete-case']
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction): Promise<void> {
        const caseId = command.options.getInteger('case', true);

        const caseData = await bot.moderation.getCase(command.guildId, caseId);

        if (!caseData) {
            const embed = new EmbedBuilder()
                .setTitle(`Case #${caseId}`)
                .setDescription(`Case \`${caseId}\` does not exist`)
                .setColor(Colors.Red)
                .setFooter(getFooter(command.user.displayAvatarURL()));

            command.editReply({
                embeds: [embed]
            });

            return;
        }

        await bot.moderation.removeCase(command.guildId, caseId);

        const embed = new EmbedBuilder()
            .setTitle(null)
            .setDescription(`Case #${caseId} removed successfully`)
            .setColor(0x00ffff)
            .setFooter(getFooter(command.user.displayAvatarURL()));

        command.editReply({
            embeds: [embed]
        });
    }
}