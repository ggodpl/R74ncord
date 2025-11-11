import { BaseInteraction, ChatInputCommandInteraction } from "discord.js";
import { Bot } from "../../bot";
import { EventHandle } from "../handle";

export default class CommandCreateHandler extends EventHandle<'interactionCreate'> {
    constructor () {
        super({
            name: "commandCreate",
            event: "interactionCreate",
            once: false,
        });
    }

    execute(bot: Bot, interaction: BaseInteraction): void {
        if (!interaction.isChatInputCommand()) return;
        
        bot.commands.handleInteraction(interaction as ChatInputCommandInteraction);
    }
}