import { SlashCommandIntegerOption, ChatInputCommandInteraction, MessageFlags, SlashCommandRoleOption } from "discord.js";
import { Command, CommandPermissionLevel } from "../../command";
import { Bot } from "../../../bot";

export default class AddRole extends Command {
    constructor () {
        super({
            name: "add-role",
            description: "Adds a level role",
            permissionLevel: CommandPermissionLevel.ADMIN,
            options: [
                new SlashCommandIntegerOption()
                    .setName("level")
                    .setDescription("Level")
                    .setRequired(true)
                    .setMinValue(1),
                new SlashCommandRoleOption()
                    .setName("role")
                    .setDescription("Role")
                    .setRequired(true)
            ]
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        
        const level = command.options.getInteger("level");
        const role = command.options.getRole("role");

        bot.levelRoles.addLevelRole(command.guildId, level, role.id);

        command.editReply({
            content: `${role} role will now be given after reaching level ${level}`
        });
    }
}