import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from "discord.js";
import { Command, CommandPermissionLevel } from "../../command";
import { Bot } from "../../../bot";
import { formatDate } from "../../../utils/date";

export default class LevelElements extends Command {
    constructor () {
        super({
            name: "level-elements",
            description: "Displays guild level elements",
            permissionLevel: CommandPermissionLevel.ADMIN
        });
    }

    displayLevelColors(levelElements: any[]) {
        return levelElements.length > 0 ? levelElements.map(l => `**Level ${l.level}**: \`${l.element}\``).join("\n") : "*No level elements*";
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        const levelElements = await bot.levelElements.getLevelElements(command.guildId);        
        
        const embed = new EmbedBuilder()
            .setTitle(`${command.guild.name} level elements`)
            .setDescription(this.displayLevelColors(levelElements))
            .setColor("#00ffff")
            .setFooter({
                text: `${command.user.username} • ${formatDate(new Date())}`,
                iconURL: command.user.displayAvatarURL()
            });

        command.editReply({
            embeds: [embed]
        });
    }
}