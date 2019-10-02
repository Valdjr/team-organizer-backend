const { Router } = require("express");
const mongoose = require("mongoose");
const empty = require("is-empty");

require("../models/Users");
require("../models/Roles");
require("../models/Skill");
const Users = mongoose.model("users");
const Roles = mongoose.model("roles");
const Skill = mongoose.model("skills");

const router = new Router();

const getName = async number => {
  const roles = await Roles.find();
  //const number = Math.floor(Math.random() * 1000);
  const name = `My Name is Number${number}`;
  const email = `name${number}@teammaker.com`;
  const exp = Math.floor(Math.random() * 25 + 1);
  const role_id = roles[Math.floor(Math.random() * roles.length)]._id;
  const avatar = `https://api.adorable.io/avatars/134/${number}.png`;

  return { name, email, avatar, exp, role_id };
};

router.get("/", async (req, res) => {
  const teste = [];
  for (let i = 0; i < 1000; i++) {
    const newUser = await getName(i);
    const users = await Users.findOne({ email: newUser.email });

    if (empty(users)) {
      teste.push(newUser);
      // console.log(`será criado o user '${newUser.name}'`);
      const createdUser = await new Users(newUser).save().catch(err => err);

      const skills = [];
      for (let i = 0; i < Math.floor(Math.random() * 5 + 1); i++) {
        const level = Math.floor(Math.random() * 5 + 1);

        skills.push({
          name: `The name Skill '${i + 1}' will be updated`,
          level
        });
      }

      const createdSkill = await new Skill({ user_id: createdUser._id, skills })
        .save()
        .catch(err => err);

      const newScore = createdSkill.skills.reduce(
        (total, skill) => total + createdUser.exp * skill.level,
        0
      );

      const updatedUser = await Users.findByIdAndUpdate(
        createdSkill.user_id,
        {
          skill_id: createdSkill._id,
          score: newScore
        },
        { new: true }
      );
    }
  }
  return res.send({ qtd: teste.length });
});

module.exports = router;
