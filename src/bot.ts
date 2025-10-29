import { Client, ClientOptions, IntentsBitField } from "discord.js";
import { Registry } from "./registry";
import { EventHandle } from "./events/handle";
import { Handler } from "./handlers/handler";
import { Command } from "./commands/command";
import { CommandHandler } from "./handlers/commandHandler";
import { EventHandler } from "./handlers/eventHandler";

export class Bot {
    client: Client;

    clientId: string;
    clientSecret: string;

    commands!: CommandHandler;
    events!: EventHandler;

    constructor (options?: ClientOptions) {
        this.client = new Client({ intents: IntentsBitField.Flags.MessageContent, ...options });

        this.clientId = process.env.CLIENT_ID ?? "";
        this.clientSecret = process.env.CLIENT_SECRET ?? "";

        this.commands = undefined;
        this.events = undefined;
    }

    addEventHandle(event: string, listener: EventHandle<any>) {
        const handler = (...args: any[]) => listener.execute(this, ...args);
        if (listener.isOnce()) this.client.once(event, handler);
        else this.client.on(event, handler);

        return this;
    }

    setCommandHandler(handler: CommandHandler) {
        this.commands = handler;

        return this;
    }

    setEventHandler(handler: EventHandler) {
        this.events = handler;

        return this;
    }

    async init() {
        await this.commands.initalize();
        await this.events.initalize();

        await this.commands.deployCommands();
    }

    login() {
        const token = process.env.DISCORD_TOKEN!;
        this.clientId = process.env.CLIENT_ID ?? "";
        this.clientSecret = process.env.CLIENT_SECRET ?? "";

        this.client.login(token);

        return this;
    }
}