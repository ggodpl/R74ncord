import { SlashCommandIntegerOption, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command, CommandPermissionLevel } from "../../command";
import { Bot } from "../../../bot";

export default class RemoveLevelElement extends Command {
    constructor () {
        super({
            name: "remove-level-element",
            description: "Removes a level element",
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

        bot.levelElements.removeLevelElement(command.guildId, level);

        command.reply({
            content: `Successfully removed element for level ${level}`,
            flags: MessageFlags.Ephemeral
        });
    }
}