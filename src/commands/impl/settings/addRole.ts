import { SlashCommandIntegerOption, ChatInputCommandInteraction, MessageFlags, SlashCommandRoleOption, SlashCommandBooleanOption } from "discord.js";
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
                    .setRequired(true),
                new SlashCommandBooleanOption()
                    .setName("keep")
                    .setDescription("Keep")
                    .setRequired(false),
            ]
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        const level = command.options.getInteger("level", true);
        const role = command.options.getRole("role", true);
        const keep = command.options.getBoolean("keep", true);

        bot.levelRoles.addLevelRole(command.guildId!, level, role.id, keep);

        command.editReply({
            content: `${role} role will now be given after reaching level ${level}`
        });
    }
}