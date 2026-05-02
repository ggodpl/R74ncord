import { BaseInteraction, ContextMenuCommandInteraction, MessageContextMenuCommandInteraction, UserContextMenuCommandInteraction } from "discord.js";
import { Bot } from "../../bot";
import { EventHandle } from "../handle";

export default class ContextMenuCreateHandler extends EventHandle<'interactionCreate'> {
    constructor () {
        super({
            name: "contextMenuCreate",
            event: "interactionCreate",
            once: false,
        });
    }

    execute(bot: Bot, interaction: BaseInteraction): void {
        if (!interaction.isContextMenuCommand()) return;
        
        bot.contextMenus.handleInteraction(interaction as MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction);
    }
}