import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, PermissionFlagsBits } from "discord.js";
import { Command, CommandPermissionLevel } from "../../command";
import { Bot } from "../../../bot";
import { formatDate } from "../../../utils/date";

export default class GetLevelRoles extends Command {
    constructor () {
        super({
            name: "roles",
            description: "Displays available level roles",
        });
    }

    displayRoles(roles: any[], isMod: boolean) {
        return roles.length > 0 ? roles.map(l => `**Level ${l.level}**: <@&${l.role}>${isMod ? ` (Keep: \`${l.keep ? 'true' : 'false'}\`)` : ''}`).join("\n") : "*No level roles*";
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        const roles = await bot.levelRoles.getLevelRoles(command.guildId);

        const isMod = command.memberPermissions.has(PermissionFlagsBits.BanMembers);
        
        const embed = new EmbedBuilder()
            .setTitle(`${command.guild.name} level elements`)
            .setDescription(this.displayRoles(roles, isMod))
            .setColor("#00ffff")
            .setFooter({
                text: `${command.user.username} • ${formatDate(new Date())}`,
                iconURL: command.user.displayAvatarURL()
            });

        command.editReply({
            embeds: [embed],
        });
    }
}