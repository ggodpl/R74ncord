import { ChatInputCommandInteraction, Colors, EmbedBuilder, SlashCommandIntegerOption } from 'discord.js';
import { Command, CommandPermissionLevel } from '../../command';
import { Bot } from '../../../bot';
import { getFooter } from '../../../utils/embed';

export default class StrikeNote extends Command {
    constructor () {
        super({
            name: 'strike-note',
            description: 'Strikes a specific note',
            permissionLevel: CommandPermissionLevel.CHAT_MOD,
            options: [
                new SlashCommandIntegerOption()
                    .setName('note')
                    .setDescription('Note to strike')
                    .setRequired(true)
                    .setMinValue(0)
            ],
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction): Promise<void> {
        const noteId = command.options.getInteger('note', true);

        const noteData = await bot.moderation.getNote(command.guildId!, noteId);

        if (!noteData) {
            const embed = new EmbedBuilder()
                .setTitle(`Note #${noteId}`)
                .setDescription(`Note \`${noteId}\` does not exist`)
                .setColor(Colors.Red)
                .setFooter(getFooter(command.user.displayAvatarURL()));

            command.editReply({
                embeds: [embed]
            });

            return;
        }

        await bot.moderation.strikeNote(command.guildId!, noteId);

        const embed = new EmbedBuilder()
            .setTitle(null)
            .setDescription(`Note #${noteId} stricken successfully`)
            .setColor(0x00ffff)
            .setFooter(getFooter(command.user.displayAvatarURL()));

        command.editReply({
            embeds: [embed]
        });
    }
}