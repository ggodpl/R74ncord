import { Schema, model } from 'mongoose';

const schema = new Schema({
    userId: {
        type: String,
        required: true
    },
    messageContent: {
        type: Boolean,
        default: false
    }
});

export default model('Policy', schema);