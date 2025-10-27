import { EventHandle } from "../events/handle";
import { Logger } from "../logger";
import { Handler } from "./handler";

export class EventHandler extends Handler<EventHandle> {
    load(path: string): void {
        const closure = async () => {
            const handle = (await import(path))?.default;
            if (!handle || typeof handle !== "function") return Logger.error(`Invalid event handle at ${Handler.formatPath(path)}`, "EVENT LOADER");

            const instance = new handle();

            if (!(instance instanceof EventHandle)) return Logger.error(`Invalid event handle at ${Handler.formatPath(path)}`, "EVENT LOADER")

            this.register(instance.getName(), instance);
        }

        closure();
    }

    override register(name: string, entity: EventHandle): void {
        super.register(name, entity);

        this.bot.addEventHandle(entity.getEvent(), entity);
    }
}