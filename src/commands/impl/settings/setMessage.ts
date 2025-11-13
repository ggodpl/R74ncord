import { ChatInputCommandInteraction, SlashCommandStringOption } from "discord.js";
import { Bot } from "../../../bot";
import { Command, CommandPermissionLevel } from "../../command";

export default class SetMessage extends Command {
    constructor () {
        super({
            name: "set-message",
            description: "Sets the level-up announcement message",
            permissionLevel: CommandPermissionLevel.ADMIN,
            options: [
                new SlashCommandStringOption()
                    .setName("message")
                    .setDescription("Announcement message. You can use following placeholders: %user%, %xp%, %level% and %rank%")
                    .setRequired(true)
            ]
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        const message = command.options.getString("message", true);

        await bot.settings.setGuildMessage(command.guildId, message);

        command.editReply(`Level-up announcement message successfully set to ${message}!`);
    }
}