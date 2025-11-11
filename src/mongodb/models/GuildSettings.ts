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
    }
});

export default model('GuildSetting', schema);