import { CommandInteraction } from "discord.js";
import { Bot } from "../../bot";
import { Logger } from "../../logger";
import { Command } from "../command";

export default class TestCommand extends Command {
    constructor () {
        super({
            name: "test",
            description: "Test command"
        })
    }

    execute(bot: Bot, command: CommandInteraction) {
        Logger.log(`Test command ran`);

        command.reply("test indeed");
    }
}