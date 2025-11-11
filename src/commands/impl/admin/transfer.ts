import { ChatInputCommandInteraction, SlashCommandUserOption, SlashCommandBooleanOption } from "discord.js";
import { Bot } from "../../../bot";
import { Command, CommandPermissionLevel } from "../../command";
import LevelSchema from "../../../mongodb/models/LevelSchema";

export default class Transfer extends Command {
    constructor () {
        super({
            name: "transfer",
            description: "Transfer XP between users",
            permissionLevel: CommandPermissionLevel.ADMIN,
            options: [
                new SlashCommandUserOption()
                    .setName("from")
                    .setDescription("User to transfer XP from")
                    .setRequired(true),
                new SlashCommandUserOption()
                    .setName("to")
                    .setDescription("User to transfer XP to")
                    .setRequired(true),
                new SlashCommandBooleanOption()
                    .setName("clear-xp")
                    .setDescription("Whether to clear User 1 XP")
                    .setRequired(false)
            ]
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        const from = command.options.getUser("from", true);
        const to = command.options.getUser("to", true);
        const clear = command.options.getBoolean("clear-xp") ?? false;
        
        const res = await LevelSchema.findByIdAndUpdate(from.id, clear ? { xp: 0 } : {});

        await LevelSchema.findByIdAndUpdate(to.id, {
            xp: res.xp
        }, {
            upsert: true
        });

        command.reply({
            content: `Successfully transfered ${res.xp} XP from ${from} to ${to}`,
            allowedMentions: {
                users: []
            }
        });
    }
}