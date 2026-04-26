import { ChannelType, ChatInputCommandInteraction, SlashCommandStringOption } from "discord.js";
import { Command, CommandPermissionLevel } from "../../command";
import { Bot } from "../../../bot";

export default class setTicketCategory extends Command {
    constructor () {
        super({
            name: 'set-ticket-starter-message',
            description: 'Sets the ticket starter message',
            permissionLevel: CommandPermissionLevel.ADMIN,
            options: [
                new SlashCommandStringOption()
                    .setName('message')
                    .setDescription('Starter message')
                    .setRequired(true),
            ]
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction): Promise<void> {
        const message = command.options.getString('message', true);

        await bot.settings.setTicketStarterMessage(command.guildId, message);

        command.editReply(`Ticket starter message successfully set to \`${message}\``);
    }
}