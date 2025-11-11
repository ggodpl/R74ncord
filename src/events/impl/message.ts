import { Message } from "discord.js";
import { Bot } from "../../bot";
import { EventHandle } from "../handle";

export default class MessageHandler extends EventHandle<'messageCreate'> {
    constructor () {
        super({
            name: "message",
            event: "messageCreate"
        });
    }

    execute(bot: Bot, message: Message): void {
        if (message.author.bot) return;
        bot.xp.gain(message.author.id, message.guildId);
    }
}