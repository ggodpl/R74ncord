import 'dotenv/config';
import { Bot } from './bot';
import { CommandHandler } from './handlers/commandHandler';
import { EventHandler } from './handlers/eventHandler';
import { ButtonHandler } from './handlers/buttonHandler';
import { ContextMenuHandler } from './handlers/contextMenuHandler';

const bot = new Bot();
bot.setCommandHandler(new CommandHandler(bot, 'commands/impl'))
   .setEventHandler(new EventHandler(bot, 'events/impl'))
   .setButtonHandler(new ButtonHandler(bot, 'buttons/impl'))
   .setContextMenuHandler(new ContextMenuHandler(bot, 'contextMenus/impl'))
   .registerCategories(
      { id: 'admin', name: 'Admin', description: 'Admin-only commands' },
      { id: 'levels', name: 'Levels', description: 'Leveling system commands' },
      { id: 'moderation', name: 'Moderation', description: 'Moderation commands' },
      { id: 'settings', name: 'Settings', description: 'Bot settings commands' },
      { id: 'ticket', name: 'Ticket', description: 'Ticketing system commands' },
   )
   .login()
   .init();