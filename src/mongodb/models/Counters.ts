import { Schema, model } from 'mongoose';

const schema = new Schema({
    guildId: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    counter: {
        type: Number,
        default: 0
    }
});

export default model('Counter', schema);