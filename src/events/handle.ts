import { ClientEvents } from "discord.js";
import { Bot } from "../bot";

export interface ListenerData {
    name: string;
    event: keyof ClientEvents;
    once?: boolean;
}

export abstract class EventHandle {
    data: ListenerData;

    constructor (data: ListenerData) {
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

    abstract execute(bot: Bot, eventData: any[]): void;
}