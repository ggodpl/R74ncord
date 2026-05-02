import { Bot } from "../bot";
import { Event } from "../events/event";
import { Logger } from "../logger";
import { Handler } from "./handler";

export class EventHandler extends Handler<Event<any>> {
    constructor (bot: Bot, directory: string) {
        super(bot, "events", directory);
    }
    
    async load(path: string): Promise<void> {
        const handle = (await import(path))?.default;
        if (!handle || typeof handle !== "function") return Logger.error(`Invalid event handle at ${Handler.formatPath(path)}`, "EVENT LOADER");

        const instance = new handle();

        if (!(instance instanceof Event)) return Logger.error(`Invalid event handle at ${Handler.formatPath(path)}`, "EVENT LOADER")

        this.register(instance.getName(), instance);
    }

    override register(name: string, entity: Event<any>): void {
        super.register(name, entity);

        this.bot.addEventHandle(entity.getEvent(), entity);
    }
}