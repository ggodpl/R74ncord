import { ChatInputCommandInteraction, SlashCommandChannelOption } from "discord.js";
import { Command, CommandPermissionLevel } from "../../command";
import { Bot } from "../../../bot";

export default class SetModLogChannel extends Command {
    constructor () {
        super({
            name: 'set-modlog-chanel',
            description: 'Sets the modlog channel',
            permissionLevel: CommandPermissionLevel.ADMIN,
            options: [
                new SlashCommandChannelOption()
                    .setName('channel')
                    .setDescription('Modlog channel')
                    .setRequired(true)
            ]
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction): Promise<void> {
        const channel = command.options.getChannel('channel', true);

        await bot.settings.setModLogChannel(command.guildId, channel.id);

        command.editReply(`Modlog channel successfully set to ${channel}`);
    }
}