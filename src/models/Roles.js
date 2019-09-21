const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Roles = new Schema(
  {
    name: {
      type: String,
      required: "Name is necessary and required"
    },
    description: {
      type: String,
      required: false
    }
  },
  {
    timestamps: true
  }
);

mongoose.model("roles", Roles);
