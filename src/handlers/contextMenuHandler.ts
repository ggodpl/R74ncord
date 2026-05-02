import { Colors, ContextMenuCommandType, EmbedBuilder, MessageContextMenuCommandInteraction, MessageFlags, ModalSubmitInteraction, REST, Routes, UserContextMenuCommandInteraction } from 'discord.js';
import { Bot } from '../bot';
import { ContextMenu, ContextMenuJSON } from '../contextMenus/contextMenu';
import { Logger } from '../logger';
import { Handler } from './handler';
import { getFooter } from '../utils/embed';
import { Registry } from '../registry';

export class ContextMenuHandler extends Handler<ContextMenu<any>> {
    raw: Registry<ContextMenuJSON>;
    
    constructor (bot: Bot, directory: string) {
        super(bot, 'contextMenus', directory);

        this.raw = new Registry();
    }

    async load(path: string): Promise<void> {
        const contextMenu = (await import(path))?.default;
        if (!contextMenu || typeof contextMenu !== 'function') return Logger.error(`Invalid context menu at ${Handler.formatPath(path)}`, 'CONTEXT MENU LOADER');

        const instance = new contextMenu();

        if (!(instance instanceof ContextMenu)) return Logger.error(`Invalid context menu at ${Handler.formatPath(path)}`, 'CONTEXT MENU LOADER');
    
        this.register(instance.getName(), instance);
    }
    
    override register<T extends ContextMenuCommandType>(name: string, contextMenu: ContextMenu<T>) {
        super.register(name, contextMenu);

        this.raw.register(name, contextMenu.toJSON());
    }

    async handleInteraction(interaction: UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction) {
        try {
            const contextMenu = this.registry.get(interaction.commandName);
            if (!contextMenu) {
                const error = new EmbedBuilder()
                    .setTitle('Unknown context menu')
                    .setDescription('The context menu you used does not exist. If you see this error, your Discord client is probably desynchornized. Refresh your Discord client and try again later.')
                    .setColor(Colors.Red)
                    .setFooter(getFooter(interaction.user.displayAvatarURL()));

                interaction.reply({
                    embeds: [error],
                    content: ''
                });
                
                return Logger.warn(`Unregistered context menu has been called: ${interaction.commandName}`, 'CONTEXT MENU');
            }

            if (!contextMenu.data.isModal) {   
                await interaction.deferReply({
                    flags: contextMenu.data.isEphemeral ? [MessageFlags.Ephemeral] : [],
                });
            }

            contextMenu.execute(this.bot, interaction);
        } catch (err) {
            Logger.error(`Error executing context menu: ${err}`, 'CONTEXT MENU');

            const error = new EmbedBuilder()
                .setTitle('Error')
                .setDescription('An error occured during execution of this interaction. Please try again later or contact the moderation team if this issue persists.')
                .setColor(Colors.Red)
                .setFooter(getFooter(interaction.user.displayAvatarURL()));
            
            await interaction.editReply({
                embeds: [error],
                content: ''
            });
        }
    }

    onModal(interaction: ModalSubmitInteraction, id: string) {
        const contextMenuName = id.replace('-modal', '');
        const contextMenu = this.registry.get(contextMenuName);

        if (!contextMenu) return;
        if (!contextMenu.isModal()) return;

        contextMenu.onModal(this.bot, interaction);
    }

    deployContextMenus() {
        const contextMenus = this.raw.toArray();

        Logger.log(`Deploying ${contextMenus.length} context menus`, 'HANDLER');

        return contextMenus;
    }
}