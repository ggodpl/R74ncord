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
    channelId: String,
    ticketId: Number,
    caseId: Number,
    closed: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true,
});

schema.pre('validate', async function () {
    if (this.ticketId != null) return;

    const counter = await Counters.findOneAndUpdate(
        {
            guildId: this.guildId,
            model: 'Tickets'
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

    this.ticketId = counter!.counter;
});

export default model('Ticket', schema);