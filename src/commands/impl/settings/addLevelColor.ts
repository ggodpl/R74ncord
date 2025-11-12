import { SlashCommandIntegerOption, SlashCommandStringOption, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command, CommandPermissionLevel } from "../../command";
import { Bot } from "../../../bot";
import { LevelElementsModule } from "../../../modules/levelElements";

export default class AddLevelColor extends Command {
    constructor () {
        super({
            name: "add-level-element",
            description: "Adds a level element",
            permissionLevel: CommandPermissionLevel.ADMIN,
            options: [
                new SlashCommandIntegerOption()
                    .setName("level")
                    .setDescription("Level")
                    .setRequired(true)
                    .setMinValue(1),
                new SlashCommandStringOption()
                    .setName("element")
                    .setDescription("Element")
                    .setRequired(true)
            ]
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        const level = command.options.getInteger("level");
        const element = command.options.getString("element");

        if (!LevelElementsModule.isElement(element)) {
            command.reply({
                content: `${element} is not a valid element`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        bot.levelElements.addLevelElement(command.guildId, level, element);

        command.reply({
            content: `Successfully added an element for level ${level}`,
            flags: MessageFlags.Ephemeral
        });
    }
}