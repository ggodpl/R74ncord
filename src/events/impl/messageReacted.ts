import { MessageReaction, User } from 'discord.js';
import { Bot } from '../../bot';
import { Event } from '../event';

export default class MessageReacted extends Event<'messageReactionAdd'> {
    constructor () {
        super({
            name: 'message',
            event: 'messageReactionAdd',
        });
    }

    execute(bot: Bot, messageReaction: MessageReaction, user: User) {
        bot.serverEvents.onReact(messageReaction, user);
    }
}