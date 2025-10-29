import { Bot } from "./bot";
import { Registry } from "./registry";

export class Base {
    bot: Bot;
    
    constructor (bot: Bot) {
        this.bot = bot;
    }
}

export class BaseRegistrar<T> {
    bot: Bot;
    registry: Registry<T>;

    constructor (bot: Bot) {
        this.bot = bot;
        this.registry = new Registry();
    }
}