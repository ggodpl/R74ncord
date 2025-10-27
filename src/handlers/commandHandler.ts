import { Command, SlashCommandJSON } from "../commands/command";
import { Logger } from "../logger";
import { Handler } from "./handler";

export class CommandHandler extends Handler<Command> {
    load(path: string): void {
        const closure = async () => {
            const command = (await import(path))?.default;
            if (!command || typeof command !== "function") return Logger.error(`Invalid command at ${Handler.formatPath(path)}`, "COMMAND LOADER");

            const instance = new command();

            if (!(instance instanceof Command) || !Command.validateCommand(instance)) return Logger.error(`Invalid event handle at ${Handler.formatPath(path)}`, "EVENT LOADER")

            this.register(instance.getName(), instance);
        }

        closure();
    }

    override register(name: string, command: Command) {
        super.register(name, command);

        // TODO: add sending commands from this registry to discord
        this.bot.getRegistry<SlashCommandJSON>("slashCommands", true)?.register(name, command.toSlashCommand());
    }
}