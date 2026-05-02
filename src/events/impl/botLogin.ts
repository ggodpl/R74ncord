import { Bot } from '../../bot';
import { Logger } from '../../logger';
import { Event } from '../event';

export default class BotLoginHandler extends Event<'clientReady'> {
    constructor () {
        super({
            name: 'botLogin',
            event: 'clientReady',
            once: true
        });
    }

    execute(bot: Bot): void {
        Logger.log(`Bot logged in as ${bot.client.user?.tag}`);
    }
}