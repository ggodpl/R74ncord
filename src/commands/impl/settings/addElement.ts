import { SlashCommandIntegerOption, SlashCommandStringOption, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Command, CommandPermissionLevel } from "../../command";
import { Bot } from "../../../bot";
import { LevelElementsModule } from "../../../modules/levelElements";

export default class AddElement extends Command {
    constructor () {
        super({
            name: "add-element",
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
        const level = command.options.getInteger("level", true);
        const element = command.options.getString("element", true);

        if (!LevelElementsModule.isElement(element ?? undefined)) {
            command.editReply({
                content: `${element} is not a valid element`
            });
            return;
        }

        bot.levelElements.addLevelElement(command.guildId!, level, element);

        command.editReply({
            content: `Successfully added an element for level ${level}`
        });
    }
}