import { ApplicationCommandOptionBase, ApplicationCommandOptionType, ChatInputCommandInteraction, PermissionsBitField, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandAttachmentOption, SlashCommandBooleanOption, SlashCommandBuilder, SlashCommandChannelOption, SlashCommandIntegerOption, SlashCommandMentionableOption, SlashCommandNumberOption, SlashCommandRoleOption, SlashCommandStringOption, SlashCommandUserOption } from "discord.js";
import { Bot } from "../bot";
import { Logger } from "../logger";

export enum CommandPermissionLevel {
    USER,
    CHAT_MOD,
    MOD,
    ADMIN,
    DEV,
}

export type SlashCommandJSON = RESTPostAPIChatInputApplicationCommandsJSONBody;

export const PermissionsMap = {
    [CommandPermissionLevel.DEV]: "0",
    [CommandPermissionLevel.ADMIN]: PermissionsBitField.Flags.Administrator,
    [CommandPermissionLevel.MOD]: PermissionsBitField.Flags.BanMembers,
    [CommandPermissionLevel.CHAT_MOD]: PermissionsBitField.Flags.KickMembers,
}

export interface CommandData {
    name: string;
    description: string;
    permissionLevel?: CommandPermissionLevel;
    category?: string;
    aliases?: string[];
    options?: ApplicationCommandOptionBase[];
}

export abstract class Command {
    data: CommandData;

    constructor (data: CommandData) {
        this.data = data;
    }

    getName() {
        return this.data.name;
    }

    getDescription() {
        return this.data.description;
    }

    getPermissionLevel() {
        return this.data.permissionLevel;
    }

    getCategory() {
        return this.data.category;
    }

    setCategory(category: string) {
        this.data.category = category;
    }

    static validateCommand(cmd: Command) {
        const data = cmd.data;

        return data.name.length < 32
            && data.description.length < 100;
    }

    toSlashCommand(nameOverride?: string) {
        const builder = new SlashCommandBuilder()
            .setName(nameOverride ?? this.getName())
            .setDescription(nameOverride ? `Alias for ${this.getName()}` : this.getDescription());
        
        const perms = this.getPermissionLevel();
        if (perms) builder.setDefaultMemberPermissions(PermissionsMap[perms]);
        
        if (this.data.options) {
            // i hate this code
            // macros in TS when 
            for (const option of this.data.options) {    
                switch (option.type) {
                    case ApplicationCommandOptionType.Attachment:
                        builder.addAttachmentOption(option as SlashCommandAttachmentOption);
                        break;
                    case ApplicationCommandOptionType.Boolean:
                        builder.addBooleanOption(option as SlashCommandBooleanOption);
                        break;
                    case ApplicationCommandOptionType.Channel:
                        builder.addChannelOption(option as SlashCommandChannelOption);
                        break;
                    case ApplicationCommandOptionType.Integer:
                        builder.addIntegerOption(option as SlashCommandIntegerOption);
                        break;
                    case ApplicationCommandOptionType.Mentionable:
                        builder.addMentionableOption(option as SlashCommandMentionableOption);
                        break;
                    case ApplicationCommandOptionType.Number:
                        builder.addNumberOption(option as SlashCommandNumberOption);
                        break;
                    case ApplicationCommandOptionType.Role:
                        builder.addRoleOption(option as SlashCommandRoleOption);
                        break;
                    case ApplicationCommandOptionType.String:
                        builder.addStringOption(option as SlashCommandStringOption);
                        break;
                    case ApplicationCommandOptionType.User:
                        builder.addUserOption(option as SlashCommandUserOption);
                        break;
                    default:
                        Logger.error("Unsupported command option", "COMMAND");
                        break;
                }
            }
        }

        return builder.toJSON();
    }

    abstract execute(bot: Bot, command: ChatInputCommandInteraction): void;
}

export interface CommandCategory {
    id: string;
    name: string;
    description: string;
}