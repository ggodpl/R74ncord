import { CommandInteraction } from "discord.js";
import { Bot } from "../../../bot";
import { Logger } from "../../../logger";
import { Command } from "../../command";

export default class TestCommand extends Command {
    constructor () {
        super({
            name: "level",
            description: "Level command"
        })
    }

    async execute(bot: Bot, command: CommandInteraction) {
        const xp = await bot.levels.getUserXP(command.user.id, command.guildId);

        command.reply(`your level ${xp}`);
    }
}