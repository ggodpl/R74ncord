import { ChannelType, ChatInputCommandInteraction, SlashCommandChannelOption } from "discord.js";
import { Command, CommandPermissionLevel } from "../../command";
import { Bot } from "../../../bot";

export default class setTicketChannel extends Command {
    constructor () {
        super({
            name: 'set-ticket-channel',
            description: 'Sets the channel which will be used for tickets',
            permissionLevel: CommandPermissionLevel.ADMIN,
            options: [
                new SlashCommandChannelOption()
                    .setName('channel')
                    .setDescription('Ticket channel (has to be a forum channel)')
                    .setRequired(true),
            ]
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction): Promise<void> {
        const channel = command.options.getChannel('channel', true);

        if (channel.type != ChannelType.GuildForum) {
            command.editReply(`${channel} is not a forum channel`);
            return;
        }

        await bot.settings.setTicketForum(command.guildId, channel.id);

        command.editReply(`Ticket channel successfully set to ${channel}`);
    }
}