import { ChatInputCommandInteraction, SlashCommandStringOption } from 'discord.js';
import { Command, CommandPermissionLevel } from '../../command';
import { Bot } from '../../../bot';

export default class StartEvent extends Command {
    constructor () {
        super({
            name: 'start-event',
            description: 'Start a server event',
            permissionLevel: CommandPermissionLevel.ADMIN,
            options: [
                new SlashCommandStringOption()
                    .setName('event')
                    .setDescription('Event to start')
                    .setRequired(true)
                    .setChoices(
                        { name: 'Zombie (Halloween 2026)', value: 'zombie' },
                    )
            ]
        })
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        if (!command.inGuild()) return command.editReply({
            content: 'This command can only be used in a guild',
        });

        const event = command.options.getString('event', true);
        
        switch (event) {
            case 'zombie':
                const settings = await bot.serverEvents.zombieEvent.getEventSettings(command.guildId);
                if (!settings) return command.editReply({
                    content: 'This event is not setup yet!',
                });

                if (settings.endsAt < Date.now()) return command.editReply({
                    content: 'This event ended already!',
                });

                const result = await bot.serverEvents.zombieEvent.startEvent(command.guildId);
                if (result) {
                    command.editReply({
                        content: 'Zombie (Halloween 2026) is now live!'
                    });
                } else {
                    command.editReply({
                        content: 'Something went wrong when starting the event...',
                    });
                }

                break;
            default:
                command.editReply({
                    content: 'Unknown event',
                });
        }
    }
}