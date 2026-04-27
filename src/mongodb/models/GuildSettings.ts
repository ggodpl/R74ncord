import { Schema, model } from "mongoose";

const schema = new Schema({
    _id: {
        type: String,
        required: true
    },
    channel: String,
    message: {
        type: String,
        default: "%user% has reached level %level%!"
    },
    modlog: String,
    ticketForum: String,
    ticketStarterMessage: {
        type: String,
        default: '%user (`%username`) opened a new ticket'
    },
    transcriptChannel: String,
});

export default model('GuildSetting', schema);