import { Bot } from "../../bot";
import { Logger } from "../../logger";
import { EventHandle } from "../handle";

export default class BotLoginHandler extends EventHandle {
    constructor () {
        super({
            name: "botLogin",
            event: "clientReady",
            once: true
        });
    }

    execute(bot: Bot): void {
        Logger.log(`Bot logged in as ${bot.client.user?.tag}`);
    }
}