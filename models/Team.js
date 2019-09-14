const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Team = new Schema({
    name: {
        type: String,
        required: true
    }
});

mongoose.model('teams', Team);