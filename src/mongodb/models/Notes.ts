import { Schema, model } from 'mongoose';
import Counters from './Counters';

const schema = new Schema({
    guildId: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    note: {
        type: String,
        required: true,
    },
    noteId: Number,
    stricken: {
        type: Boolean,
        default: false,
    }
});

schema.pre('validate', async function() {
    if (this.noteId != null) return;

    const counter = await Counters.findOneAndUpdate(
        {
            guildId: this.guildId,
            model: 'Notes',
        },
        {
            $inc: { counter: 1 },
        },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
        },
    );

    this.noteId = counter!.counter;
});

export default model('Note', schema);