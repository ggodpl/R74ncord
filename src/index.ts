import "dotenv/config";
import { Bot } from "./bot";
import { CommandHandler } from "./handlers/commandHandler";
import { EventHandler } from "./handlers/eventHandler";

const bot = new Bot();
bot.setCommandHandler(new CommandHandler(bot, "commands/impl"))
   .setEventHandler(new EventHandler(bot, "events/impl"))
   .registerCategories(
      { id: "levels", name: "Levels", description: "Default category description" }
   )
   .login()
   .init();