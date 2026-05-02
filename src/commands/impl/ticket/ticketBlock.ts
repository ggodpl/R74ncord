import { ChatInputCommandInteraction, SlashCommandUserOption } from 'discord.js';
import { Command, CommandPermissionLevel } from '../../command';
import { Bot } from '../../../bot';

export default class TicketBlock extends Command {
    constructor () {
        super({
            name: 'ticket-block',
            description: 'Blocks the provided user from opening tickets',
            permissionLevel: CommandPermissionLevel.MOD,
            options: [
                new SlashCommandUserOption()
                    .setName('user')
                    .setDescription('User to block from opening tickets')
                    .setRequired(true),
            ],
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction): Promise<void> {
        const user = command.options.getUser('user', true);

        await bot.tickets.blockUser(user.id);

        command.editReply(`Successfully blocked ${user.username} from opening new tickets`);
    }
}