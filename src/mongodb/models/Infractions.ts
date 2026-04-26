import { Schema, model } from 'mongoose';
import Counters from './Counters';

const schema = new Schema({
    guildId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    infractionType: {
        type: String,
        enum: ['warn', 'timeout', 'kick', 'ban', 'softban', 'untimeout', 'unban']
    },
    reason: {
        type: String,
        default: 'No reason provided'
    },
    caseId: {
        type: Number,
    },
    moderator: {
        type: String,
        required: true
    },
    duration: Number
}, {
    timestamps: true
});

schema.pre('validate', async function () {
    if (this.caseId != null) return;

    const counter = await Counters.findOneAndUpdate(
        {
            guildId: this.guildId,
            model: 'Infractions'
        },
        {
            $inc: { counter: 1 }
        },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
        }
    );

    this.caseId = counter!.counter;
});

export default model('Infraction', schema);