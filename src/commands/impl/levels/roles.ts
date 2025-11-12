import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from "discord.js";
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

    displayRoles(roles: any[]) {
        return roles.length > 0 ? roles.map(l => `**Level ${l.level}**: <@&${l.role}>`).join("\n") : "*No level roles*";
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        const roles = await bot.levelRoles.getLevelRoles(command.guildId);        
        
        const embed = new EmbedBuilder()
            .setTitle(`${command.guild.name} level elements`)
            .setDescription(this.displayRoles(roles))
            .setColor("#00ffff")
            .setFooter({
                text: `${command.user.username} • ${formatDate(new Date())}`,
                iconURL: command.user.displayAvatarURL()
            });

        command.reply({
            embeds: [embed],
        });
    }
}