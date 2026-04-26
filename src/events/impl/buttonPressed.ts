import { BaseInteraction, ChatInputCommandInteraction } from "discord.js";
import { Bot } from "../../bot";
import { EventHandle } from "../handle";

export default class ButtonPressedHandler extends EventHandle<'interactionCreate'> {
    constructor () {
        super({
            name: "buttonPressed",
            event: "interactionCreate",
            once: false,
        });
    }

    execute(bot: Bot, interaction: BaseInteraction): void {
        if (!interaction.isButton()) return;
        
    }
}