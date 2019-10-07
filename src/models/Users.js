const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Users = new Schema({
  name: {
    type: String,
    required: "[ERROR] Name is required"
  },
  email: {
    type: String,
    required: "[ERROR] Email is required",
    trim: true,
    lowercase: true,
    index: true,
    unique: true
  },
  discord_id: {
    type: String,
    required: false
  },
  exp: {
    type: Number,
    required: "[ERROR] Please enter your years of experience"
  },
  avatar: {
    type: String,
    required: false
  },
  role_id: {
    type: Schema.Types.ObjectId,
    ref: "roles",
    required: "[ERROR] Please choose your Role"
  },
  skill_id: {
    type: Schema.Types.ObjectId,
    ref: "skills",
    required: false
  },
  team_id: {
    type: Schema.Types.ObjectId,
    ref: "teams",
    required: false
  },
  score: {
    type: Number,
    required: false
  }
});

mongoose.model("users", Users);
