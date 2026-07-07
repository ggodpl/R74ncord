import { ChatInputCommandInteraction, LabelBuilder, ModalBuilder, ModalSubmitInteraction, RoleSelectMenuBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { Bot } from '../../../bot';
import { Command, CommandPermissionLevel, ModalCommand } from '../../command';
import ms, { StringValue } from 'ms';

export default class SetupFreePing extends Command implements ModalCommand {
    constructor () {
        super({
            name: 'setup-free-ping',
            description: 'Sets free ping up',
            permissionLevel: CommandPermissionLevel.ADMIN,
            isModal: true,
        })
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        const modal = new ModalBuilder()
            .setCustomId('commands-setup-free-ping-modal')
            .setTitle('Free Ping setup');

        const pingingRoleSelect = new RoleSelectMenuBuilder()
            .setCustomId('pinging-role')
            .setPlaceholder('Select the pinging role')
            .setRequired(true)
            .setMaxValues(1)
            .setMinValues(1);
        
        const pingableRoleSelect = new RoleSelectMenuBuilder()
            .setCustomId('pingable-role')
            .setPlaceholder('Select the pingable role')
            .setRequired(true)
            .setMaxValues(1)
            .setMinValues(1);
        
        const guildCooldownInput = new TextInputBuilder()
            .setCustomId('guild-cooldown')
            .setPlaceholder('Default: 30s')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        const channelCooldownInput = new TextInputBuilder()
            .setCustomId('channel-cooldown')
            .setPlaceholder('Default: 1m')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        const userCooldownInput = new TextInputBuilder()
            .setCustomId('user-cooldown')
            .setPlaceholder('Default: 5m')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        const current = await bot.freePing.repository.getFreePingSettings(command.guildId!);    
        
        if (current) {
            if (current.pingingRole) pingingRoleSelect.setDefaultRoles(current.pingingRole);
            if (current.pingableRole) pingableRoleSelect.setDefaultRoles(current.pingableRole);
            if (current.guildCooldown !== undefined) guildCooldownInput.setPlaceholder(`Current: ${ms(current.guildCooldown)}`);
            if (current.channelCooldown !== undefined) channelCooldownInput.setPlaceholder(`Current: ${ms(current.channelCooldown)}`);
            if (current.userCooldown !== undefined) userCooldownInput.setPlaceholder(`Current: ${ms(current.userCooldown)}`);
        }

        const pingingRoleLabel = new LabelBuilder()
            .setLabel('Select the pinging role (the real Free Ping)')
            .setRoleSelectMenuComponent(pingingRoleSelect);
        
        const pingableRoleLabel = new LabelBuilder()
            .setLabel('Select the pingable role (the fake Free Ping)')
            .setRoleSelectMenuComponent(pingableRoleSelect);
        
        const guildCooldownLabel = new LabelBuilder()
            .setLabel('Guild cooldown')
            .setTextInputComponent(guildCooldownInput);
        
        const channelCooldownLabel = new LabelBuilder()
            .setLabel('Channel cooldown')
            .setTextInputComponent(channelCooldownInput);
        
        const userCooldownLabel = new LabelBuilder()
            .setLabel('User cooldown')
            .setTextInputComponent(userCooldownInput);
        
        modal.addLabelComponents(pingingRoleLabel, pingableRoleLabel, guildCooldownLabel, channelCooldownLabel, userCooldownLabel);
    
        await command.showModal(modal);
    }
    
    async onModal(bot: Bot, interaction: ModalSubmitInteraction) {
        const pingingRole = interaction.fields.getSelectedRoles('pinging-role', true).first();
        const pingableRole = interaction.fields.getSelectedRoles('pingable-role', true).first();
        const guildCooldownRaw = interaction.fields.getTextInputValue('guild-cooldown');
        const guildCooldown = guildCooldownRaw ? ms(guildCooldownRaw as StringValue) : undefined;
        const channelCooldownRaw = interaction.fields.getTextInputValue('channel-cooldown');
        const channelCooldown = channelCooldownRaw ? ms(channelCooldownRaw as StringValue) : undefined;
        const userCooldownRaw = interaction.fields.getTextInputValue('user-cooldown');
        const userCooldown = userCooldownRaw ? ms(userCooldownRaw as StringValue) : undefined;

        await bot.freePing.repository.setFreePingSettings(
            interaction.guildId!,
            pingingRole?.id,
            pingableRole?.id,
            guildCooldown,
            channelCooldown,
            userCooldown,
        );

        await interaction.reply('Free Ping was setup successfully!');
    }
}