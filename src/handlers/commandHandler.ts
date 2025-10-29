import { CommandInteraction, REST, Routes } from "discord.js";
import { Bot } from "../bot";
import { Command, SlashCommandJSON } from "../commands/command";
import { Logger } from "../logger";
import { Registry } from "../registry";
import { Handler } from "./handler";

export class CommandHandler extends Handler<Command> {
    slashCommands: Registry<SlashCommandJSON>;

    constructor (bot: Bot, directory: string) {
        super(bot, "commands", directory);

        this.slashCommands = new Registry();
    }

    async load(path: string): Promise<void> {
        const command = (await import(path))?.default;
        if (!command || typeof command !== "function") return Logger.error(`Invalid command at ${Handler.formatPath(path)}`, "HANDLER");

        const instance = new command();

        if (!(instance instanceof Command) || !Command.validateCommand(instance)) return Logger.error(`Invalid command at ${Handler.formatPath(path)}`, "HANDLER")

        this.register(instance.getName(), instance);
    }

    override register(name: string, command: Command) {
        super.register(name, command);

        // TODO: add sending commands from this registry to discord
        this.slashCommands.register(name, command.toSlashCommand());
    }

    handleInteraction(interaction: CommandInteraction) {
        const command = this.registry.get(interaction.commandName);
        if (!command) return Logger.warn(`Unregistered command has been called: ${interaction.commandName}`);

        command.execute(this.bot, interaction);
    }

    async deployCommands() {
        const commands = this.slashCommands.toArray();

        Logger.log(`Deploying ${commands.length} commands`, "HANDLER");

        const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
        await rest.put(
            Routes.applicationCommands(this.bot.clientId),
            { body: commands }
        );
    }
}