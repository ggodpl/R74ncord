import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Bot } from '../../../bot';
import { Command, CommandPermissionLevel } from '../../command';
import { getFooter } from '../../../utils/embed';

export default class EnumerateGuilds extends Command {
    constructor () {
        super({
            name: 'enumerate-guilds',
            description: 'Enumerates guilds',
            permissionLevel: CommandPermissionLevel.DEV,
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        if (command.user.id !== process.env['DEV_USER']) return;
        const guilds = await Promise.all(bot.client.guilds.cache.map(async g => `${g.name} (${g.id})\n - Owner: ${(await g.fetchOwner()).user.username}\n - Members: ${g.memberCount}`));
        
        const embed = new EmbedBuilder()
            .setTitle('Guilds')
            .setDescription(guilds.join('\n'))
            .setFooter(getFooter(command.user.displayAvatarURL()));

        command.editReply({
            embeds: [embed],
        });
    }
}