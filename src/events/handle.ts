import { ClientEvents } from "discord.js";
import { Bot } from "../bot";

export interface ListenerData<E> {
    name: string;
    event: E;
    once?: boolean;
}

export abstract class EventHandle<E extends keyof ClientEvents> {
    data: ListenerData<E>;

    constructor (data: ListenerData<E>) {
        this.data = data;
    }

    getName() {
        return this.data.name;
    }

    getEvent() {
        return this.data.event;
    }

    isOnce() {
        return this.data.once;
    }

    abstract execute(bot: Bot, ...args: ClientEvents[E]): void;
}