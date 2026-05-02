import { Schema, model } from 'mongoose';

const schema = new Schema({
    guildId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    }
});

export default model('TicketBlock', schema);