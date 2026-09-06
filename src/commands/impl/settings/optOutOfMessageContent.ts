import { ChatInputCommandInteraction, SlashCommandBooleanOption } from 'discord.js';
import { Bot } from '../../../bot';
import { Command } from '../../command';

export default class OptOutOfMessageContent extends Command {
    constructor () {
        super({
            name: 'opt-out-of-message-content',
            description: 'Opt-out of message content usage',
            isEphemeral: true,
            options: [
                new SlashCommandBooleanOption()
                    .setName('opt-out')
                    .setDescription('Whether you want to opt-out. If false, the command will opt-in instead. True by default')
                    .setRequired(false),
            ]
        });
    }
    
    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        const userId = command.user.id;
        const optOut = command.options.getBoolean('opt-out') ?? true;

        bot.policy.setMessageContentOptOutStatus(userId, optOut);

        command.editReply({
            content: `Successfully opted ${optOut ? 'out' : 'in'}. You will ${optOut ? 'no longer' : 'now'} be able to use the Free Ping ${optOut ? 'or' : 'and'} Modmail (Tickets) features.${optOut ? ' You can opt back in at any time' : ''}`
        });
    }
}