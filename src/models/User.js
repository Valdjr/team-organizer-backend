const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema({
    name: {
        type: String,
        required: '[ERROR] Name is required'
    },
    email: {
        type: String,
        required: '[ERROR] Email is required',
        trim: true,
        lowercase: true,
        unique: true
    },
    discord_id: {
        type: String,
        required: false
    },
    avatar: {
        type: String,
        required: false
    },
    role_id: {
        type: Schema.Types.ObjectId,
        ref: 'roles',
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
        required: false
    }
});

mongoose.model('users', User);