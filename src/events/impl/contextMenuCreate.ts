import { BaseInteraction, MessageContextMenuCommandInteraction, UserContextMenuCommandInteraction } from 'discord.js';
import { Bot } from '../../bot';
import { Event } from '../event';

export default class ContextMenuCreateHandler extends Event<'interactionCreate'> {
    constructor () {
        super({
            name: 'contextMenuCreate',
            event: 'interactionCreate',
            once: false,
        });
    }

    execute(bot: Bot, interaction: BaseInteraction): void {
        if (!interaction.isContextMenuCommand()) return;
        
        bot.contextMenus.handleInteraction(interaction as MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction);
    }
}