import { ChatInputCommandInteraction, SlashCommandRoleOption, SlashCommandStringOption, SlashCommandUserOption } from 'discord.js';
import { Bot } from '../../../bot';
import { Command, CommandPermissionLevel } from '../../command';
import ms, { StringValue } from 'ms';
import { getRelativeTimestamp } from '../../../utils/date';

class SetupZombieEvent extends Command {
    constructor () {
        super({
            name: 'zombie',
            description: 'Setup the Zombie event',
            permissionLevel: CommandPermissionLevel.ADMIN,
            options: [
                new SlashCommandRoleOption()
                    .setName('infected-role')
                    .setDescription('Role')
                    .setRequired(true),
                new SlashCommandStringOption()
                    .setName('event-duration')
                    .setDescription('Duration of the event (e.g. 14d)')
                    .setRequired(true),
                new SlashCommandUserOption()
                    .setName('patient-zero')
                    .setDescription('Patient zero')
                    .setRequired(true),
            ],
            dm: false,
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        if (!command.inGuild()) return command.editReply({
            content: 'This command can only be used in a guild',
        });
        const role = command.options.getRole('infected-role', true);
        const duration = command.options.getString('event-duration', true);
        const patientZero = command.options.getUser('patient-zero', true);

        const durationMs = ms(duration as StringValue);
        if (durationMs === undefined) {
            return command.editReply({
                content: 'Invalid duration',
            });
        }

        await bot.serverEvents.zombieEvent.repository.setEventSettings(command.guildId, role.id, Date.now() + durationMs);
        await bot.serverEvents.zombieEvent.infectUser(command.guildId, patientZero.id, '0');

        await command.editReply({
            content: `Successfully setup the Zombie event. The event ends ${getRelativeTimestamp(durationMs)}, infection role: ${role}`,
            allowedMentions: {
                roles: [],
                users: [],
            }
        });
    }
}

export default class SetupEvent extends Command {
    constructor () {
        super({
            name: 'setup-event',
            description: 'Setup a server event',
            permissionLevel: CommandPermissionLevel.ADMIN,
            subcommands: [
                new SetupZombieEvent(),
            ],
            dm: false,
        })
    }

    execute() {}
}