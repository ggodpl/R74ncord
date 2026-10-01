import { Schema, model } from 'mongoose';

const schema = new Schema({
    guildId: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    infectedSince: {
        type: Date,
        default: Date.now
    },
    infectedBy: {
        type: String,
        required: true,
    }
});

schema.index({ guildId: 1, userId: 1 });

export default model('Zombie_InfectedUser', schema);