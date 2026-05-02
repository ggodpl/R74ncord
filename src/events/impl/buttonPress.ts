import { BaseInteraction } from 'discord.js';
import { Bot } from '../../bot';
import { EventHandle } from '../handle';

export default class ButtonPressHandler extends EventHandle<'interactionCreate'> {
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