import { Schema, model } from 'mongoose';

const schema = new Schema({
    guildId: {
        type: String,
        required: true,
        index: true,
    },
    running: {
        type: Boolean,
        default: false,
    },
    startedAt: Date,
    infectedRole: {
        type: String,
        required: true,
    },
    endsAt: {
        type: Date,
        required: true,
    }
});

export default model('Zombie_GuildSetting', schema);