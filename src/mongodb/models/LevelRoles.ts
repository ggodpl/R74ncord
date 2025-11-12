import { Schema, model } from "mongoose";

const schema = new Schema({
    _id: {
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
    }
});

export default model('LevelRole', schema);