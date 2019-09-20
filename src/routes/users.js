const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
require("../models/User");
const User = mongoose.model("users");
require("../models/Team");
const Team = mongoose.model("teams");
require("../models/Role");
const Role = mongoose.model("roles");

router.get("/", (req, res) => {
  console.log(req.query);

  //PESQUISA POR EMAIL OU NOME
  let searchBy = {};
  if (req.query.name_like) {
    searchBy = { name: { $regex: ".*" + req.query.name_like + ".*" } };
  } else if (req.query.email_like) {
    searchBy = { email: { $regex: ".*" + req.query.email_like + ".*" } };
  }

  User.find(searchBy, [], { sort: { [req.query._sort]: req.query._order } })
    .then(users => {
      res.send(users);
    })
    .catch(err => {
      res.send({ error: err });
    });
});

module.exports = router;
