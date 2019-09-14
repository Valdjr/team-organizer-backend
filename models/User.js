const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema({
    name: {
        type: String,
        required: true
    },
    discord_id: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    skills: {
        type: Array,
        required: true
    },
    exp: {
        type: Number,
        required: true
    },
    team_id: {
        type: Schema.Types.ObjectId,
        ref: 'teams',
        required: true
    }
});

mongoose.model('users', User);