import { ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Colors, ContainerBuilder, EmbedBuilder, MessageFlags, SlashCommandStringOption, SlashCommandUserOption } from 'discord.js';
import { Command, CommandPermissionLevel } from '../../command';
import { Bot } from '../../../bot';
import { getFooter } from '../../../utils/embed';

export default class Note extends Command {
    constructor () {
        super({
            name: 'note',
            description: 'Puts a mod-only note on a user',
            permissionLevel: CommandPermissionLevel.CHAT_MOD,
            options: [
                new SlashCommandUserOption()
                    .setName('user')
                    .setDescription('User to warn')
                    .setRequired(true),
                new SlashCommandStringOption()
                    .setName('note')
                    .setDescription('Note message')
                    .setRequired(true),
            ],
            isEphemeral: true,
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction): Promise<void> {
        const user = command.options.getUser('user', true);
        const note = command.options.getString('note', true);
    
        const savedNote = await bot.moderation.note(command.guildId!, user.id, note);

        const embed = new EmbedBuilder()
            .setTitle('Infraction')
            .setDescription(`\`${savedNote!.noteId}\` | User noted: ${note}`)
            .setColor(Colors.Yellow)
            .setFooter(getFooter(command.user.displayAvatarURL()));

        command.editReply({
            embeds: [embed]
        });
    }
}