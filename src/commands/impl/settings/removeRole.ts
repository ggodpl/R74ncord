import { SlashCommandIntegerOption, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command, CommandPermissionLevel } from "../../command";
import { Bot } from "../../../bot";

export default class RemoveRole extends Command {
    constructor () {
        super({
            name: "remove-role",
            description: "Removes a level role",
            permissionLevel: CommandPermissionLevel.ADMIN,
            options: [
                new SlashCommandIntegerOption()
                    .setName("level")
                    .setDescription("Level")
                    .setRequired(true)
                    .setMinValue(1)
            ]
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        
        const level = command.options.getInteger("level");

        bot.levelRoles.removeLevelRole(command.guildId, level);

        command.editReply({
            content: `Successfully removed role for level ${level}`
        });
    }
}