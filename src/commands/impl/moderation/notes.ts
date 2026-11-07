import { ChatInputCommandInteraction, Colors, EmbedBuilder, SlashCommandBooleanOption, SlashCommandStringOption, SlashCommandUserOption } from 'discord.js';
import { Command, CommandPermissionLevel } from '../../command';
import { Bot } from '../../../bot';
import { getFooter } from '../../../utils/embed';

export default class Notes extends Command {
    constructor () {
        super({
            name: 'notes',
            description: "Gets user's notes",
            permissionLevel: CommandPermissionLevel.CHAT_MOD,
            options: [
                new SlashCommandUserOption()
                    .setName('user')
                    .setDescription('User to get notes for')
                    .setRequired(true)
            ],
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction): Promise<void> {
        const user = command.options.getUser('user', true);

        const notes = await bot.moderation.getNotes(command.guildId!, user.id);

        if (!notes.length) {
            const embed = new EmbedBuilder()
                .setTitle('Notes')
                .setDescription(`This user has no notes yet`)
                .setColor(0x00ffff)
                .setFooter(getFooter(command.user.displayAvatarURL()));

            command.editReply({
                embeds: [embed]
            });
            return;
        }

        const noteStrings = notes.map(i => `${i.stricken ? '~~' : ''}\`${i.noteId}\`\n${i.note}${i.stricken ? '~~' : ''}`);

        const embed = new EmbedBuilder()
            .setTitle('Notes')
            .setDescription(noteStrings.join('\n'))
            .setColor(0x00ffff)
            .setFooter(getFooter(user.displayAvatarURL()));

        command.editReply({
            embeds: [embed]
        });
    }
}