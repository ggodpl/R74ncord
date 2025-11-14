import { ChatInputCommandInteraction, SlashCommandUserOption, SlashCommandIntegerOption } from "discord.js";
import { Bot } from "../../../bot";
import { Command, CommandPermissionLevel } from "../../command";
import LevelSchema from "../../../mongodb/models/LevelSchema";
import { LevelsModule } from "../../../modules/levels";

export default class SetLevel extends Command {
    constructor () {
        super({
            name: "set-level",
            description: "Sets user's level",
            permissionLevel: CommandPermissionLevel.MOD,
            options: [
                new SlashCommandUserOption()
                    .setName("user")
                    .setDescription("User")
                    .setRequired(true),
                new SlashCommandIntegerOption()
                    .setName("level")
                    .setDescription("Level to set to")
                    .setRequired(true)
            ]
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        const user = command.options.getUser("user", true);
        const level = command.options.getInteger("level", true);
        
        const res = await LevelSchema.findOneAndUpdate({ userId: user.id, guildId: command.guildId }, {
            xp: level == 0 ? 0 : LevelsModule.sumXP(level - 1),
            level
        }, {
            upsert: true
        });

        bot.levelRoles.levelUp(user.id, command.guildId, level);

        command.editReply({
            content: `Successfully set user level from ${res.level} to ${level}`,
            allowedMentions: {
                users: []
            }
        });
    }
}