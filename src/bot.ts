import { Client, ClientOptions, Partials } from "discord.js";
import { EventHandle } from "./events/handle";
import { CommandCategory } from "./commands/command";
import { CommandHandler } from "./handlers/commandHandler";
import { EventHandler } from "./handlers/eventHandler";
import { MongoDB } from "./mongodb/mongodb";
import { LevelsModule } from "./modules/levels";
import { RankCard } from "./modules/rankCard";
import { SettingsModule } from "./modules/settings";
import { XPModule } from "./modules/xp";
import { LevelElementsModule } from "./modules/levelElements";
import { LevelRolesModule } from "./modules/levelRoles";
import { ModerationModule } from "./modules/moderation";
import { Scheduler } from "./modules/scheduler";
import { TicketsModule } from "./modules/tickets";

export class Bot {
    client: Client;

    clientId: string;
    clientSecret: string;

    commands!: CommandHandler;
    events!: EventHandler;

    db: MongoDB;
    levels: LevelsModule;
    settings: SettingsModule;
    xp: XPModule;
    levelElements: LevelElementsModule;
    levelRoles: LevelRolesModule;
    moderation: ModerationModule;
    scheduler: Scheduler;
    tickets: TicketsModule;

    constructor (options?: ClientOptions) {
        this.client = new Client({ intents: ['Guilds', 'GuildMessages', 'MessageContent', 'DirectMessages', 'GuildBans', 'GuildModeration'], partials: [Partials.Channel], ...options });

        this.clientId = process.env.CLIENT_ID ?? "";
        this.clientSecret = process.env.CLIENT_SECRET ?? "";

        this.commands = undefined;
        this.events = undefined;

        this.db = new MongoDB(this);
        this.levels = new LevelsModule(this);
        this.settings = new SettingsModule(this);
        this.xp = new XPModule(this);
        this.levelElements = new LevelElementsModule(this);
        this.levelRoles = new LevelRolesModule(this);
        this.moderation = new ModerationModule(this);
        this.scheduler = new Scheduler(this);
        this.tickets = new TicketsModule(this);
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

    registerCategories(...categories: CommandCategory[]) {
        this.commands.registerCategories(categories);

        return this;
    }

    async init() {
        await this.commands.initialize();
        await this.events.initialize();

        await this.commands.deployCommands();

        await this.db.initialize(process.env.MONGODB_URI);

        RankCard.initialize();
        this.tickets.initialize();
    }

    login() {
        const token = process.env.DISCORD_TOKEN!;
        this.clientId = process.env.CLIENT_ID ?? "";
        this.clientSecret = process.env.CLIENT_SECRET ?? "";

        this.client.login(token);

        return this;
    }
}