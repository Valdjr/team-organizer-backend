const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Team = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    project: {
      type: String,
      maxlength: 100,
      required: false
    },
    description: {
      type: String,
      required: false,
      maxlength: 255
    },
    scoreTeam: {
      type: Number,
      require: false
    },
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "users"
      }
    ]
  },
  {
    timestamps: true
  }
);

mongoose.model("teams", Team);
