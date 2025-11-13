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
    element: {
        type: String,
        required: true
    }
});

export default model('LevelElement', schema);