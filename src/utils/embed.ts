import { EmbedFooterOptions } from "discord.js";
import { formatDate } from "./date"

export const getFooter = (userAvatar?: string): EmbedFooterOptions => {
    const date = formatDate(new Date());
    return { text: `${date} • R74n Server`, iconURL: userAvatar };
}