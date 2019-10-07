const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);
require("../models/Skill");
/*require("../models/Roles");*/
require("../models/Users");
const Skill = mongoose.model("skills");
/*const Role = mongoose.model('roles');*/
const User = mongoose.model("users");

router.get("/", async (req, res) => {
  const skills = await Skill.find(
    {},
    {
      createdAt: 0,
      updatedAt: 0,
      __v: 0
    }
  ).populate("user_id", { _id: 1, name: 1 });
  if (!skills) {
    return res.status(400).send({ error: "Não há nenhuma Skill cadastrada" });
  }

  return res.send(skills);
});

router.get("/:user_id/all", (req, res) => {
  Skill.find(
    { user_id: req.params.user_id },
    {
      createdAt: 0,
      updatedAt: 0,
      __v: 0
    }
  )
    .populate("user_id", { name: 1, email: 1 })
    .then(skills => {
      if (!skills.length) {
        res.status(404).send({ vazio: "Não existe nenhuma Skill cadastrada" });
      }
      res.send(skills);
    })
    .catch(err => {
      res.status(400).send({ error: `Aqui é o erro do find: ${err}` });
    });
});

router.get("/:id", (req, res) => {
  const list = Skill.findById(req.params.id, {
    createdAt: 0,
    updatedAt: 0,
    __v: 0
  })
    .populate("user_id", { name: 1, email: 1 })
    .then(skills => {
      res.send(skills);
    })
    .catch(err => err);
  res.send(list);
});

router.delete("/all", async (req, res) => {
  console.log("Apagando todos os skills");
  const skills = await Skill.find();

  await skills.map(async (deletedId, index) => {
    console.log(`aqui deve ser o id: ${deletedId._id}, e o index é ${index}`);
    await User.findByIdAndUpdate(
      { _id: deletedId.user_id },
      {
        score: 0,
        skill_id: undefined
      }
    );
    await Skill.findByIdAndDelete(deletedId._id);
  });

  return res.send({ ok: `Foram apagados ${skills.length}` });
});

router.delete("/:id", (req, res) => {
  console.log(`Apagou o Skill '${req.params.id}'`);
  const deleteSkill = Skill.findByIdAndDelete(req.params.id)
    .then(async e => {
      await User.findByIdAndUpdate(
        { _id: e.user_id },
        {
          score: 0,
          skill_id: undefined
        }
      );
      res.send({ OK: `A Skill ID: ${e._id} foi apagada` });
    })
    .catch(err => err);
  res.send(deleteSkill);
});

router.put("/:id", async (req, res) => {
  const errors = [];
  if (!req.body) {
    return res.status(400).send({ error: "No fields are filled" });
  }

  const skills = await req.body.skills.map((num, index) => {
    if (num.newName && num.name !== num.newName) {
      num.name = num.newName;
    }
    if (num.newLevel && num.level !== num.newLevel) {
      num.level = num.newLevel;
    }

    if (!num.name) {
      errors.push({ name: "Name not found" });
    }
    return num;
  });

  if (errors.length) {
    return res.status(402).send(errors);
  } else {
    const updatedSkill = await Skill.findOneAndUpdate(
      { _id: req.params.id },
      {
        skills
      },
      { new: true }
    );
    if (!updatedSkill) {
      return res.status(400).send({ error: "não achou a skill" });
    }

    const { exp, score } = await User.findById(req.body.user_id);

    if (!exp && !score) {
      return res.status(400).send({ error: "não achou o Usuário" });
    }
    const newScore = await updatedSkill.skills.reduce(
      (total, skill) => total + exp * skill.level,
      0
    );

    const updatedUser = await User.findByIdAndUpdate(
      req.body.user_id,
      {
        score: newScore
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(401).send({ error: "Problema na atualização" });
    }

    return res.send({ updatedSkill, score: updatedUser.score });
  }
});

router.post("/acrescentandoSkillEmMassa", async (req, res) => {
  const listUser = await User.find(
    { skill_id: [undefined, null] },
    { _id: 1, name: 1, exp: 1, skill_id: 1 }
  );

  const createdSkill = listUser.map(async u => {
    const skills = [];
    for (let i = 0; i < Math.floor(Math.random() * 5 + 1); i++) {
      const level = Math.floor(Math.random() * 5 + 1);

      skills.push({ name: "The name Skill will be updated", level });
    }

    const created = await new Skill({ user_id: u._id, skills })
      .save()
      .catch(err => err);

    const newScore = created.skills.reduce(
      (total, skill) => total + u.exp * skill.level,
      0
    );

    const updatedUser = await User.findByIdAndUpdate(
      created.user_id,
      {
        skill_id: created._id,
        score: newScore
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(401).send({ error: "Problema na atualização" });
    }

    return {
      created,
      score: updatedUser.score
    }; /**/
  });

  return res.send({ createdSkill });
});

router.post("/", async (req, res) => {
  const errors = [];
  if (!req.body.user_id) {
    errors.push({ user_id: "User was not passed" });
  }

  if (!req.body.skills) {
    errors.push({ skills: "Skills was not passed" });
  }

  const skillExists = await User.findOne({ _id: req.body.user_id });

  console.log(skillExists.skill_id);
  if (skillExists.skill_id) {
    errors.push("User already has Skill group, please update");
  }
  const skills = req.body.skills.map((num, index) => {
    if (index < req.body.skills.length) {
      if (num.name === undefined) {
        errors.push({
          error: `O campo NAME não foi preenchido no ${index + 1}º skill`
        });
      }
      if (num.level === undefined) {
        errors.push({
          error: `O campo LEVEL não foi preenchido no ${index + 1}º skill`
        });
      }
      return num;
    }
  });

  const newSkill = {
    skills,
    user_id: req.body.user_id
  };

  if (errors.length) {
    res.status(400).send({ error: errors });
  } else {
    const createdSkill = new Skill(newSkill)
      .save()
      .then(async e => {
        const newScore = await newSkill.skills.reduce(
          (total, skill) => total + skillExists.exp * skill.level,
          0
        );

        const updatedUser = await User.findByIdAndUpdate(
          req.body.user_id,
          {
            skill_id: e._id,
            score: newScore
          },
          { new: true }
        );

        if (!updatedUser) {
          return res.status(401).send({ error: "Problema na atualização" });
        }

        res.send({
          createdSkill: e.populate("user_id"),
          score: updatedUser.score
        });
      })
      .catch(err => {
        res
          .status(400)
          .send({ error: `Aqui é o erro do save do Skill: ${err}` });
      });
  }
});

module.exports = router;
