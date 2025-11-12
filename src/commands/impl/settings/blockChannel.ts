import { ChatInputCommandInteraction, SlashCommandChannelOption } from "discord.js";
import { Command, CommandPermissionLevel } from "../../command";
import { Bot } from "../../../bot";
import BlockedChannels from "../../../mongodb/models/BlockedChannels";

export default class BlockChannel extends Command {
    constructor () {
        super({
            name: "block",
            description: "Blocks XP gains on a channel",
            permissionLevel: CommandPermissionLevel.ADMIN,
            options: [
                new SlashCommandChannelOption()
                    .setName("channel")
                    .setDescription("Channel to block")
                    .setRequired(true)
            ]
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        const channel = command.options.getChannel("channel");

        await BlockedChannels.findOneAndUpdate({
            guildId: command.guildId,
            channelId: channel.id
        }, { }, {
            upsert: true
        });

        command.editReply({
            content: `${channel} is now blocked`
        });
    }
}