import { Schema, model } from 'mongoose';

const schema = new Schema({
    guildId: {
        type: String,
        required: true,
        unique: true,
    },
    pingingRole: String,
    pingableRole: String,
    channelCooldown: {
        type: Number,
        default: 60 * 1000,
    },
    userCooldown: {
        type: Number,
        default: 5 * 60 * 1000,
    },
    guildCooldown: {
        type: Number,
        default: 30 * 1000,
    },
    minimumLevel: {
        type: Number,
        default: 0
    },
});

export default model('FreePingRole', schema);