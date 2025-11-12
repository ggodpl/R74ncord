import { ChatInputCommandInteraction, SlashCommandChannelOption } from "discord.js";
import { Command, CommandPermissionLevel } from "../../command";
import { Bot } from "../../../bot";
import BlockedChannels from "../../../mongodb/models/BlockedChannels";

export default class UnlockChannel extends Command {
    constructor () {
        super({
            name: "unblock",
            description: "Unblocks XP gains on a channel",
            permissionLevel: CommandPermissionLevel.ADMIN,
            options: [
                new SlashCommandChannelOption()
                    .setName("channel")
                    .setDescription("Channel to unblock")
                    .setRequired(true)
            ]
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        const channel = command.options.getChannel("channel");

        await BlockedChannels.findOneAndDelete({
            guildId: command.guildId,
            channelId: channel.id
        });

        command.editReply({
            content: `${channel} is now unblocked`
        });
    }
}