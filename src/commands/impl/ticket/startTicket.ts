import { ChatInputCommandInteraction, SlashCommandIntegerOption, SlashCommandStringOption } from 'discord.js';
import { Command } from '../../command';
import { Bot } from '../../../bot';

export default class StartTicket extends Command {
    constructor () {
        super({
            name: 'start-ticket',
            description: 'Starts a ticket',
            options: [
                new SlashCommandIntegerOption()
                    .setName('case-id')
                    .setDescription('case id')
                    .setRequired(false),
                new SlashCommandStringOption()
                    .setName('message')
                    .setDescription('message')
                    .setRequired(false),
            ]
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction): Promise<void> {
        const caseId = command.options.getInteger('case-id', false);
        const message = command.options.getString('message', false);

        const created = await bot.tickets.createTicket(command.user.id, {
            message,
            caseId
        });

        console.log(created);

        command.editReply('ok');
    }
}