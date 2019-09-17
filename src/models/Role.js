const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Role = new Schema({
  name: {
    type: String,
    required: 'Name is necessary and required'
  }
});

mongoose.model('roles', Role);