import { Schema, model } from "mongoose";

const schema = new Schema({
    guildId: {
        type: String,
        required: true
    },
    channelId: {
        type: String,
        required: true
    }
});

export default model('BlockedChannel', schema);