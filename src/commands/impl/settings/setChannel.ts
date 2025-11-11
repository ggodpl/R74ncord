import { ChatInputCommandInteraction, SlashCommandChannelOption } from "discord.js";
import { Bot } from "../../../bot";
import { Command, CommandPermissionLevel } from "../../command";

export default class SetChannel extends Command {
    constructor () {
        super({
            name: "set-channel",
            description: "Sets the level-up announcement channel",
            permissionLevel: CommandPermissionLevel.ADMIN,
            options: [
                new SlashCommandChannelOption()
                    .setName("channel")
                    .setDescription("Channel to set")
                    .setRequired(true)
            ]
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        const channel = command.options.getChannel("channel", true);

        await bot.settings.setGuildChannel(command.guildId, channel.id);

        command.reply(`Level-up announcement channel successfully set to ${channel}!`);
    }
}