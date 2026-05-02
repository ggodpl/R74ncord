import { BaseInteraction, ChatInputCommandInteraction } from 'discord.js';
import { Bot } from '../../bot';
import { Event } from '../event';

export default class CommandCreateHandler extends Event<'interactionCreate'> {
    constructor () {
        super({
            name: 'commandCreate',
            event: 'interactionCreate',
            once: false,
        });
    }

    execute(bot: Bot, interaction: BaseInteraction): void {
        if (!interaction.isChatInputCommand()) return;
        
        bot.commands.handleInteraction(interaction as ChatInputCommandInteraction);
    }
}