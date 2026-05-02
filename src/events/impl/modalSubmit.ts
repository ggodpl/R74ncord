import { BaseInteraction } from 'discord.js';
import { Bot } from '../../bot';
import { Event } from '../event';

export default class ModalSubmitHandler extends Event<'interactionCreate'> {
    constructor () {
        super({
            name: 'modalSubmit',
            event: 'interactionCreate',
            once: false,
        });
    }

    execute(bot: Bot, interaction: BaseInteraction): void {
        if (!interaction.isModalSubmit()) return;

        const id = interaction.customId;

        if (id.startsWith('commands-')) {
            bot.commands.onModal(interaction, id.replace('commands-', ''));
        } else if (id.startsWith('context-')) {
            bot.contextMenus.onModal(interaction, id.replace('context-', ''));
        }
    }
}