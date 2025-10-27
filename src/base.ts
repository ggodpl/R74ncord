import { Bot } from "./bot";

export class Base {
    bot: Bot;
    
    constructor (bot: Bot) {
        this.bot = bot;
    }
}