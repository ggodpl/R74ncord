import { ChatInputCommandInteraction, SlashCommandUserOption } from 'discord.js';
import { Command, CommandPermissionLevel } from '../../command';
import { Bot } from '../../../bot';

export default class TicketUnblock extends Command {
    constructor () {
        super({
            name: 'ticket-unblock',
            description: 'Unblocks the provided user from opening tickets',
            permissionLevel: CommandPermissionLevel.MOD,
            options: [
                new SlashCommandUserOption()
                    .setName('user')
                    .setDescription('User to unblock')
                    .setRequired(true),
            ],
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction): Promise<void> {
        const user = command.options.getUser('user', true);

        await bot.tickets.unblockUser(user.id);

        command.editReply(`Successfully unblocked \`${user.username}\`. They can now make new tickets`);
    }
}