import { ChatInputCommandInteraction, Colors, EmbedBuilder, MessageFlags, REST, Routes } from "discord.js";
import { Bot } from "../bot";
import { Command, CommandCategory, SlashCommandJSON } from "../commands/command";
import { Logger } from "../logger";
import { Registry } from "../registry";
import { Handler } from "./handler";
import { basename } from "path";
import { getFooter } from "../utils/embed";

export class CommandHandler extends Handler<Command> {
    slashCommands: Registry<SlashCommandJSON>;
    aliases: Registry<string>;
    categories: Registry<CommandCategory>;

    constructor (bot: Bot, directory: string) {
        super(bot, "commands", directory);

        this.slashCommands = new Registry();
        this.aliases = new Registry();
        this.categories = new Registry();
    }

    async load(path: string, dirPath: string, base: boolean): Promise<void> {
        const command = (await import(path))?.default;
        if (!command || typeof command !== "function") return Logger.error(`Invalid command at ${Handler.formatPath(path)}`, "HANDLER");

        const instance = new command();

        if (!(instance instanceof Command) || !Command.validateCommand(instance)) return Logger.error(`Invalid command at ${Handler.formatPath(path)}`, "HANDLER")

        if (!base) instance.setCategory(basename(dirPath));

        this.register(instance.getName(), instance);
    }

    override register(name: string, command: Command) {
        super.register(name, command);

        this.slashCommands.register(name, command.toSlashCommand());

        if (command.data.aliases) {
            for (const alias of command.data.aliases) {
                this.slashCommands.register(alias, command.toSlashCommand(alias));
                this.aliases.register(alias, name);
            }
        }
    }

    async handleInteraction(interaction: ChatInputCommandInteraction) {
        try {
            const command = this.registry.get(interaction.commandName) ?? this.registry.get(this.aliases.get(interaction.commandName));
            if (!command) {
                const error = new EmbedBuilder()
                    .setTitle('Unknown command')
                    .setDescription('The command you used does not exist. If you see this error, your Discord client is probably desynchornized. Refresh your Discord client and try again later.')
                    .setColor(Colors.Red)
                    .setFooter(getFooter(interaction.user.displayAvatarURL()));

                interaction.reply({
                    embeds: [error],
                    content: ''
                });
                
                return Logger.warn(`Unregistered command has been called: ${interaction.commandName}`);
            }

            await interaction.deferReply({
                flags: command.data.isEphemeral ? [MessageFlags.Ephemeral] : []
            });
            command.execute(this.bot, interaction);
        } catch (err) {
            Logger.error(`Error executing command: ${err}`, "COMMAND");
            const error = new EmbedBuilder()
                .setTitle('Error')
                .setDescription('An error occured during execution of this cmomand. Please try again later or contact the moderation team.')
                .setColor(Colors.Red)
                .setFooter(getFooter(interaction.user.displayAvatarURL()));
            
            await interaction.editReply({
                embeds: [error],
                content: ''
            });
        }
    }

    registerCategories(categories: CommandCategory[]) {
        for (const category of categories) {
            this.categories.register(category.id, category);
        }
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