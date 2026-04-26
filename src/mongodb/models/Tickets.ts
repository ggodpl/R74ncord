import { Schema, model } from 'mongoose';

const schema = new Schema({
    guildId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    channelId: {
        type: String,
        required: true
    },
    caseId: Number,
}, {
    timestamps: true,
});

export default model('Ticket', schema);