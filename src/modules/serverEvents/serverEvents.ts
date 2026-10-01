import { Message, MessageReaction, User } from 'discord.js';
import { Base, Messagable, Reactable } from '../../base';
import { ZombieEventModule } from './zombieEvent';

export class ServerEvents extends Base implements Messagable<true>, Reactable {
    public zombieEvent = new ZombieEventModule(this.bot);

    async onMessage(message: Message<true>) {
        await this.zombieEvent.onMessage(message);
    }

    async onReact(messageReaction: MessageReaction, user: User) {
        await this.zombieEvent.onReact(messageReaction, user);
    }
}