import { ButtonInteraction, Colors, EmbedBuilder } from 'discord.js';
import { Bot } from '../bot';
import { Button } from '../buttons/button';
import { Logger } from '../logger';
import { Handler } from './handler';
import { getFooter } from '../utils/embed';

export class ButtonHandler extends Handler<Button> {
    constructor (bot: Bot, directory: string) {
        super(bot, 'buttons', directory);
    }

    async load(path: string): Promise<void> {
        const button = (await import(path))?.default;
        if (!button || typeof button !== 'function') return Logger.error(`Invalid button at ${Handler.formatPath(path)}`, 'BUTTON LOADER');

        const instance = new button();

        if (!(instance instanceof Button)) return Logger.error(`Invalid button at ${Handler.formatPath(path)}`, 'BUTTON LOADER');

        this.register(instance.getName(), instance);
    }

    async handleInteraction(interaction: ButtonInteraction) {
        try {
            const [name, ...args] = interaction.customId.split('_');
            const button = this.registry.get(name);
            if (!button) {
                const error = new EmbedBuilder()
                    .setTitle('Unknown interaction')
                    .setDescription('No idea how you got this error, please contact the moderation team')
                    .setColor(Colors.Red)
                    .setFooter(getFooter(interaction.user.displayAvatarURL()));

                interaction.reply({
                    embeds: [error],
                    content: ''
                });
                
                return Logger.warn(`Unregistered interaction has been called: ${interaction.id}`, 'BUTTON');
            }

            await interaction.deferReply();

            button.execute(this.bot, interaction, ...args);
        } catch (err) {
            Logger.error(`Error executing button: ${err}`, 'BUTTON');

            try {
                const error = new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription('An error occured during execution of this interaction. Please try again later or contact the moderation team if this issue persists.')
                    .setColor(Colors.Red)
                    .setFooter(getFooter(interaction.user.displayAvatarURL()));
                
                await interaction.editReply({
                    embeds: [error],
                    content: ''
                });
            
            } catch (err) {
                // something is seriously fucked if this gets triggered
                // just log the message and don't try to reply again
                Logger.error(`Error sending error message: ${err}`, 'BUTTON');
            }
        }
    }
}