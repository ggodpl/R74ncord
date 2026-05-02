import { Bot } from '../bot';
import { UserContextMenuCommandInteraction, MessageContextMenuCommandInteraction, ApplicationCommandType, ContextMenuCommandBuilder, ContextMenuCommandType, RESTPostAPIContextMenuApplicationCommandsJSONBody } from 'discord.js';
import { CommandPermissionLevel, PermissionsMap } from '../commands/command';

export interface ContextMenuData<T extends ContextMenuCommandType> {
    name: string;
    type: T;
    permissionLevel?: CommandPermissionLevel;
    isEphemeral?: boolean;
}

export type ContextMenuJSON = RESTPostAPIContextMenuApplicationCommandsJSONBody;

export abstract class ContextMenu<T extends ContextMenuCommandType> {
    data: ContextMenuData<T>;

    constructor (data: ContextMenuData<T>) {
        this.data = data;
    }

    getName() {
        return this.data.name;
    }

    getPermissionLevel() {
        return this.data.permissionLevel;
    }

    toJSON() {
        const builder = new ContextMenuCommandBuilder()
            .setName(this.getName())
            .setType(this.data.type);
        
        const perms = this.getPermissionLevel();
        if (perms) builder.setDefaultMemberPermissions(PermissionsMap[perms]);

        return builder.toJSON();
    }

    abstract execute(bot: Bot, interaction: T extends ApplicationCommandType.User ? UserContextMenuCommandInteraction : MessageContextMenuCommandInteraction): void;
}