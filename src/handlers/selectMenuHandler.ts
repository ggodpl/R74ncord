import { Colors, EmbedBuilder, StringSelectMenuInteraction } from 'discord.js';
import { Bot } from '../bot';
import { SelectMenu } from '../selectMenus/selectMenu';
import { Logger } from '../logger';
import { Handler } from './handler';
import { getFooter } from '../utils/embed';

export class SelectMenuHandler extends Handler<SelectMenu> {
    constructor (bot: Bot, directory: string) {
        super(bot, 'select menus', directory);
    }

    async load(path: string): Promise<void> {
        const selectMenu = (await import(path))?.default;
        if (!selectMenu || typeof selectMenu !== 'function') return Logger.error(`Invalid select menu at ${Handler.formatPath(path)}`, 'SELECT MENU LOADER');

        const instance = new selectMenu();

        if (!(instance instanceof SelectMenu)) return Logger.error(`Invalid select menu at ${Handler.formatPath(path)}`, 'SELECT MENU LOADER');

        this.register(instance.getName(), instance);
    }

    async handleInteraction(interaction: StringSelectMenuInteraction) {
        try {
            const [name, ...args] = interaction.customId.split('_');
            const selectMenu = this.registry.get(name);
            if (!selectMenu) {
                const error = new EmbedBuilder()
                    .setTitle('Unknown interaction')
                    .setDescription('No idea how you got this error, please contact the moderation team')
                    .setColor(Colors.Red)
                    .setFooter(getFooter(interaction.user.displayAvatarURL()));

                interaction.reply({
                    embeds: [error],
                    content: ''
                });

                return Logger.warn(`Unregistered interaction has been called: ${interaction.id}`, 'SELECT MENU');
            }

            await interaction.deferReply();

            await selectMenu.execute(this.bot, interaction, interaction.values, ...args);
        } catch (err) {
            Logger.error(`Error executing select menu: ${err}`, 'SELECT MENU');

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
                Logger.error(`Error sending error message: ${err}`, 'SELECT MENU');
            }
        }
    }
}
