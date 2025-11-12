import { ChatInputCommandInteraction, CommandInteraction, EmbedBuilder, MessageFlags, SlashCommandIntegerOption } from "discord.js";
import { Bot } from "../../../bot";
import { Command } from "../../command";
import { formatDate } from "../../../utils/date";

export default class Leaderboard extends Command {
    constructor () {
        super({
            name: "leaderboard",
            description: "Leaderboard command",
            aliases: ["levels", "top"],
            options: [
                new SlashCommandIntegerOption()
                    .setName("page")
                    .setDescription("Page to display")
                    .setRequired(false)
                    .setMinValue(1),
                new SlashCommandIntegerOption()
                    .setName("per-page")
                    .setDescription("How many entries to display on every page")
                    .setRequired(false)
                    .setMinValue(1)
                    .setMaxValue(50)
            ]
        })
    }

    displayUsers(users: any[], userId: string, page: number, perPage: number) {
        return users.map((u, i) => (
            `**#${((page - 1) * perPage) + i + 1}${u.userId == userId ? "" : "**"} <@${u.userId}> XP: \`${u.xp}\`${u.userId == userId ? "**" : ""}`
        )).join("\n");
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        
        const page = command.options.getInteger("page") ?? 1;
        const perPage = command.options.getInteger("per-page") ?? 10;

        const pages = await bot.levels.getPages(perPage);
        if (page > pages) {
            return command.reply({
                content: "The page you entered doesn't exist!",
                flags: [MessageFlags.Ephemeral]
            });
        }

        const users = await bot.levels.getUsers(command.guildId, page, perPage);

        let description = this.displayUsers(users, command.user.id, page, perPage);

        if (!users.some(u => u.userId == command.user.id)) {
            const userXP = await bot.levels.getUser(command.user.id, command.guildId);

            description = `**#${userXP.rank} <@${command.user.id}> XP: \`${userXP.xp}\`**\n` + description;
        }

        const embed = new EmbedBuilder()
            .setTitle(`${command.guild.name} text leaderboard`)
            .setDescription(description)
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