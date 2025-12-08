import { Schema, model } from "mongoose";

const schema = new Schema({
    guildId: {
        type: String,
        required: true
    },
    level: {
        type: Number,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    keep: {
        type: Boolean,
        default: false
    }
});

export default model('LevelRole', schema);