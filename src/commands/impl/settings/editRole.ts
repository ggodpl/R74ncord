import { SlashCommandIntegerOption, ChatInputCommandInteraction, MessageFlags, SlashCommandRoleOption, SlashCommandBooleanOption } from "discord.js";
import { Command, CommandPermissionLevel } from "../../command";
import { Bot } from "../../../bot";

export default class EditRole extends Command {
    constructor () {
        super({
            name: "edit-role",
            description: "Edits a level role",
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
                    .setRequired(false),
                new SlashCommandBooleanOption()
                    .setName("keep")
                    .setDescription("Keep")
                    .setRequired(false),
            ]
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        const level = command.options.getInteger("level");
        const role = command.options.getRole("role");
        const keep = command.options.getBoolean("keep");

        bot.levelRoles.editLevelRole(command.guildId, level, role?.id, keep);

        command.editReply({
            content: `Edited role for level ${level}`
        });
    }
}