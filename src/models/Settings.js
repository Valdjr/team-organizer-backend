const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Settings = new Schema({
  name: {
    type: String,
    unique: [true, "The Settgins Name is unique"],
    required: [true, "What is the NAME of the Settings?"]
  },
  minUser: {
    type: Number,
    min: 2,
    required: true
  },
  maxUser: {
    type: Number,
    min: 2,
    required: true
  },
  roles: [
    {
      role_id: {
        type: Schema.Types.ObjectId,
        ref: "roles",
        required: [true, "[ERROR] Please choose your Role"]
      },
      /* Foi verificado que não é necessário ter um nº mínimo de users por Role
      minRole: {
        type: Number,
        required: true,
      }, */
      maxRole: {
        type: Number,
        max: this.maxUser,
        required: true
      }
    }
  ]
});

mongoose.model("settings", Settings);
