import { ChatInputCommandInteraction, SlashCommandUserOption, SlashCommandIntegerOption } from "discord.js";
import { Bot } from "../../../bot";
import { Command, CommandPermissionLevel } from "../../command";
import LevelSchema from "../../../mongodb/models/LevelSchema";
import { LevelsModule } from "../../../modules/levels";

export default class SetXP extends Command {
    constructor () {
        super({
            name: "set-xp",
            description: "Sets user's XP",
            permissionLevel: CommandPermissionLevel.MOD,
            options: [
                new SlashCommandUserOption()
                    .setName("user")
                    .setDescription("User")
                    .setRequired(true),
                new SlashCommandIntegerOption()
                    .setName("xp")
                    .setDescription("Amount of XP to set")
                    .setRequired(true)
            ]
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        const user = command.options.getUser("user", true);
        const xp = command.options.getInteger("xp", true);
        
        const res = await LevelSchema.findOneAndUpdate({ userId: user.id, guildId: command.guildId }, {
            xp,
            level: LevelsModule.getLevel(xp)
        }, {
            upsert: true
        });

        bot.levelRoles.levelUp(user.id, command.guildId, LevelsModule.getLevel(xp));

        command.editReply({
            content: `Successfully set user XP from ${res?.xp ?? 0} to ${xp}`,
            allowedMentions: {
                users: []
            }
        });
    }
}