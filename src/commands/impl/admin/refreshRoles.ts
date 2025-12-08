import { ChatInputCommandInteraction, SlashCommandUserOption } from "discord.js";
import { Bot } from "../../../bot";
import { Command, CommandPermissionLevel } from "../../command";
import LevelSchema from "../../../mongodb/models/LevelSchema";

export default class RefreshRoles extends Command {
    constructor () {
        super({
            name: "refresh-roles",
            description: "Refresh user level roles",
            permissionLevel: CommandPermissionLevel.MOD,
            options: [
                new SlashCommandUserOption()
                    .setName("user")
                    .setDescription("User")
                    .setRequired(true)
            ]
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        const user = command.options.getUser("user", true);
        const res = await LevelSchema.findOne({ userId: user.id, guildId: command.guildId });
    
        bot.levelRoles.levelUp(user.id, command.guildId, res.level);

        command.editReply({
            content: `Successfully refreshed level roles for ${user}`,
            allowedMentions: {
                users: []
            }
        })
    }
}