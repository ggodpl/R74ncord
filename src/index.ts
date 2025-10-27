import "dotenv/config";
import { Bot } from "./bot";
import { CommandHandler } from "./handlers/commandHandler";
import { EventHandler } from "./handlers/eventHandler";

const bot = new Bot();
bot.addHandler(new CommandHandler(bot, "commands", "commands/impl"));
bot.addHandler(new EventHandler(bot, "events", "events/impl"));
bot.login();