import { ChatInputCommandInteraction, CommandInteraction, SlashCommandUserOption } from "discord.js";
import { Bot } from "../../../bot";
import { Logger } from "../../../logger";
import { Command } from "../../command";
import { RankCard } from "../../../modules/rankCard";
import { LevelsModule } from "../../../modules/levels";

export default class TestCommand extends Command {
    constructor () {
        super({
            name: "level",
            description: "Level command",
            aliases: ["rank"],
            options: [
                new SlashCommandUserOption()
                    .setName("user")
                    .setDescription("User whose rank card you want to view")
                    .setRequired(false)
            ]
        })
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        const user = command.options.getUser("user") ?? command.user;

        const { xp, level, rank } = await bot.levels.getUser(user.id, command.guildId);
        
        const max = LevelsModule.getLevelXP(level);

        const buffer = await RankCard.generateRankCard(user.displayAvatarURL({ extension: "png" }), user.username, {
            xp: LevelsModule.getRelativeXP(xp, level),
            totalXp: xp,
            level,
            max,
            rank
        });

        command.reply({
            files: [
                buffer
            ]
        });
    }
}