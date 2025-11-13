import { ChatInputCommandInteraction, SlashCommandAttachmentOption } from "discord.js";
import { Bot } from "../../../bot";
import { Command, CommandPermissionLevel } from "../../command";
import LevelSchema from "../../../mongodb/models/LevelSchema";
import { LevelsModule } from "../../../modules/levels";
import axios from "axios";

export default class LoadLevels extends Command {
    constructor () {
        super({
            name: "load-levels",
            description: "Loads user levels from file",
            permissionLevel: CommandPermissionLevel.MOD,
            options: [
                new SlashCommandAttachmentOption()
                    .setName("levels")
                    .setDescription("File containing user levels")
                    .setRequired(true)
            ]
        });
    }

    async execute(bot: Bot, command: ChatInputCommandInteraction) {
        const rawLevels = command.options.getAttachment("levels", true);
        const file = await axios.get(rawLevels.url);
        const data = file.data;

        const keys = Object.keys(data);
        
        command.editReply({
            content: `Loading ${keys.length} users...`
        });

        const mapped = keys.map(k => ({
            userId: k,
            guildId: command.guildId,
            xp: LevelsModule.getLevelXP(data[k]),
            level: data[k]
        }));

        await LevelSchema.insertMany(mapped, { ordered: false });

        command.editReply({
            content: `Successfully loaded levels of ${keys.length} users`,
            allowedMentions: {
                users: []
            }
        });
    }
}