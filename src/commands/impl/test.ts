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

    execute(bot: Bot, command: any): void {
        Logger.log(`Test command ran`);
    }
}