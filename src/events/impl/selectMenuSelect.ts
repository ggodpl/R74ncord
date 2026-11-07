import { BaseInteraction } from 'discord.js';
import { Bot } from '../../bot';
import { Event } from '../event';

export default class SelectMenuSelectHandler extends Event<'interactionCreate'> {
    constructor () {
        super({
            name: 'selectMenuSelect',
            event: 'interactionCreate',
            once: false,
        });
    }

    execute(bot: Bot, interaction: BaseInteraction): void {
        if (!interaction.isStringSelectMenu()) return;

        bot.selectMenus.handleInteraction(interaction);
    }
}
