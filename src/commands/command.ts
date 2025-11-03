import { CommandInteraction, PermissionsBitField, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandBuilder } from "discord.js";
import { Bot } from "../bot";

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

    toSlashCommand() {
        const builder = new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription(this.getDescription());
        
        const perms = this.getPermissionLevel();
        if (perms) builder.setDefaultMemberPermissions(PermissionsMap[perms]);

        return builder.toJSON();
    }

    abstract execute(bot: Bot, command: CommandInteraction): void;
}

export interface CommandCategory {
    id: string;
    name: string;
    description: string;
}