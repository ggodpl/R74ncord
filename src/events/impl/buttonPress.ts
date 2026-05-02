import { BaseInteraction } from 'discord.js';
import { Bot } from '../../bot';
import { Event } from '../event';

export default class ButtonPressHandler extends Event<'interactionCreate'> {
    constructor () {
        super({
            name: 'buttonPress',
            event: 'interactionCreate',
            once: false,
        });
    }

    execute(bot: Bot, interaction: BaseInteraction): void {
        if (!interaction.isButton()) return;
        
        bot.buttons.handleInteraction(interaction);
    }
}