import { Client, ClientOptions, IntentsBitField } from "discord.js";
import { Registry } from "./registry";
import { EventHandle } from "./events/handle";
import { Handler } from "./handlers/handler";

export class Bot {
    client: Client;
    registries: Registry<Registry<any>>;
    handlers: Registry<Handler<any>>;

    clientId: string;
    clientSecret: string;

    constructor (options?: ClientOptions) {
        this.client = new Client({ intents: IntentsBitField.Flags.MessageContent, ...options });
        this.registries = new Registry();
        this.handlers = new Registry();

        this.clientId = process.env.CLIENT_ID ?? "";
        this.clientSecret = process.env.CLIENT_SECRET ?? "";
    }

    addRegistry(name: string, registry: Registry<any>) {
        this.registries.register(name, registry);
    }

    removeRegistry(name: string) {
        this.registries.unregister(name);
    }

    getRegistry<T>(name: string, upsert: boolean = false): Registry<T> | undefined {
        if (upsert && !this.registries.has(name)) this.addRegistry(name, new Registry());
        return this.registries.get(name);
    }

    addEventHandle(event: string, listener: EventHandle) {
        const handler = (...args: any[]) => listener.execute(this, args);
        if (listener.isOnce()) this.client.once(event, handler);
        else this.client.on(event, handler);
    }

    addHandler<T>(handler: Handler<T>) {
        this.handlers.register(handler.registryName, handler);
    }

    login() {
        const token = process.env.DISCORD_TOKEN;
        this.clientId = process.env.CLIENT_ID ?? "";
        this.clientSecret = process.env.CLIENT_SECRET ?? "";

        this.client.login(token);
    }
}