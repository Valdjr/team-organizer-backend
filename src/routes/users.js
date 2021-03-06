const { Router } = require("express");
const mongoose = require("mongoose");
const Yup = require("yup");
const empty = require("is-empty");

const router = new Router();

require("../models/Users");
require("../models/Team");
require("../models/Roles");
require("../models/Skill");
const Users = mongoose.model("users");
const Team = mongoose.model("teams");
const Roles = mongoose.model("roles");
const Skill = mongoose.model("skills");

const validateEmail = function(email) {
  let re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  // console.log(`validateEmail => ${re.test(email)}!!`);
  return re.test(email);
};

/**
 * @param {*} items = deverá receber um array
 * @param {*} pageActual = receberá o número da página que o usuário deseja acessar
 * @param {*} limitItems = irá delimitar quantos items por página.
 */
const listItems = (items, pageActual, limitItems) => {
  let result = [];
  let totalPage = Math.ceil(items.length / limitItems);
  let count = pageActual * limitItems - limitItems;
  let delimiter = count + limitItems;

  if (pageActual <= totalPage) {
    // TODO: Create loop
    for (let i = count; i < delimiter; i++) {
      if (items[i] != null) {
        // TODO: Push in Result
        result.push(items[i]);
      }

      // TODO: Increment count
      count++;
    }
  }

  return result;
};

/**
 * @param {*} id Identificador do usuário
 * @param {*} page Número da página, caso seja vazio, será atribuído o nº 1
 * @param {*} limit Quantidade de registros que devem ser mostrados, caso seja vazio,
 * será atribuído o nº 999
 */
router.get(["/", "/:id"], async (req, res) => {
  const { id } = req.params;
  const { filter, search, sort } = req.query;
  let { page, limit } = req.query;

  const reg = new RegExp("^" + (!empty(search) ? search : ""), "i");
  const filterBy = !empty(id)
    ? { _id: id }
    : !empty(filter)
    ? { [filter]: reg }
    : {};

  //var users = await Users.find({ team_id: [undefined, null] }, { __v: 0 })
  var users = await Users.find(filterBy, { __v: 0 })
    .populate("role_id", { name: 1 })
    .populate("skill_id", { skills: 1, name: 1, level: 1 })
    .populate("team_id", { name: 1, project: 1 })
    .catch(err => {
      res.status(400).send({ error: err });
    });
  const qtd = users.length;

  empty(page) ? (page = 1) : page;
  empty(limit) ? (limit = users.length) : limit;
  if (empty(id) && !empty(sort)) {
    switch (sort) {
      case "roles":
        let roles = await Roles.find({}).sort("name");
        users = roles
          .map(({ name, _id: id }) => ({
            name: name.toUpperCase(),
            id,
            users: users.filter(user => {
              return String(id) == String(user.role_id._id);
            })
          }))
          .filter(async group => group.users.length > 0)
          .map(u => ({
            name: u.name,
            id: u.id,
            qtd: u.users.length,
            users: listItems(u.users, page, Number(limit))
          }));

        break;
      case "score":
        let scores = users.map(user => user.score);
        scores = scores
          .filter((score, pos) => scores.indexOf(score) === pos)
          .sort((a, b) => {
            if (!empty(a) && !empty(b)) {
              return a - b;
            }
          });
        users = listItems(scores, page, Number(limit))
          .map(score => {
            const new_users = users.filter(user => user.score === score);
            return {
              id: score,
              name: `${score}`,
              score: true,
              qtd: new_users.length,
              users: new_users
            };
          })
          .map(u => ({
            id: u.id,
            name: u.name,
            score: true,
            qtd: u.qtd,
            users: listItems(u.users, page, Number(limit))
          }));

        break;
      default:
    }
  } else {
    return res.send({
      qtd,
      users: listItems(users, page, Number(limit))
    });
  }

  return res.json({ qtd, users });
});

router.delete("/:id", (req, res) => {
  Users.findByIdAndRemove({ _id: req.params.id })
    .then(user => {
      res.send(user);
    })
    .catch(err => {
      res.send({ error: err });
    });
});

router.put("/atualizaScore", async (req, res) => {
  const users = await Users.find({ score: [0, 1, 2] });

  const updatedUsers = users.map(async u => {
    const { skills } = !empty(u.skill_id)
      ? await Skill.findById(u.skill_id)
      : "";

    const t = await Users.findByIdAndUpdate(
      u._id,
      {
        score: !empty(skills)
          ? skills.reduce((total, skill) => total + u.exp * skill.level, 0)
          : 0
      },
      { new: true }
    );
    return t;
  });

  return res.send({ updatedUsers });
});

router.put("/atualizaExp", async (req, res) => {
  const users = await Users.find({ exp: [0, 1, 2] });

  const updatedUsers = users.map(async u => {
    await Users.findByIdAndUpdate(
      u._id,
      { exp: Math.floor(Math.random() * 40) },
      { new: true }
    );
    return {
      name: u.name,
      exp: u.exp
    };
  });

  return res.send({ updatedUsers });
});

router.put("/:id", async (req, res) => {
  console.time("Atualizando com async/await:");
  const errors = [];

  const schema = Yup.object().shape({
    name: Yup.string(),
    email: Yup.string().email(),
    discord_id: Yup.string().max(5),
    avatar: Yup.string(),
    exp: Yup.number()
      .min(1)
      .max(50),
    // role_id: Yup.string().min(24).max(24),
    skill_id: Yup.string()
      .min(24)
      .max(24),
    team_id: Yup.string()
      .min(24)
      .max(24)
  });

  if (!(await schema.isValid(req.body))) {
    errors.push({ menseger: "Please enter your information" });
  }

  if (errors.length) {
    return res.status(401).send({ error: errors });
  } else {
    const { skills } = !empty(req.body.skill_id)
      ? await Skill.findById(req.body.skill_id)
      : "";

    const updatedUser = await Users.findOneAndUpdate(
      { _id: req.params.id },
      {
        ...req.body,
        score: !empty(skills)
          ? skills.reduce(
              (total, skill) => total + req.body.exp * skill.level,
              0
            )
          : 0
      },
      {
        new: true
      }
    );
    res.send(updatedUser);
    console.timeEnd("Atualizando com async/await:");
  }
});

router.post("/", (req, res) => {
  const errors = [];
  const { name, email, exp, role_id } = req.body;
  if (!name) {
    errors.push({ name: "Name was not passed" });
  }
  if (!email) {
    errors.push({ email: "Email was not passed" });
  }
  if (!exp) {
    errors.push({ exp: "Exp was not passed" });
  }
  if (!role_id) {
    errors.push({ role_id: "Role_id was not passed" });
  }

  // validando erros
  if (errors.length) {
    return res.status(400).send({ error: errors });
  } else {
    // verificando se usuário já existe, através do nome. PS: ACHO QUE PODE SER APAGADO
    Users.findOne({ name: req.body.name })
      .then(user => {
        if (user) {
          errors.push({ name: "User already exists" });
        }
      })
      .catch(err => {
        errors.push({ name: err });
      });

    // verificando se existe User, através do e-mail
    if (
      validateEmail(req.body.email) &&
      req.body.email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
    ) {
      Users.findOne({ email: req.body.email })
        .then(user => {
          if (user) {
            errors.push({ email: "User already exists" });
          }
        })
        .catch(err => {
          errors.push({ email: err });
        });
    } else {
      errors.push({ email: "Email is invalid" });
    }

    // verificando se role_id existe
    if (req.body.role_id.match(/^[0-9a-fA-F]{24}$/)) {
      Roles.findById(req.body.role_id)
        .then(role => {
          if (!role) {
            errors.push({
              role_id: "Role_id does not exists. Please create a Role."
            });
          }
        })
        .catch(err => {
          errors.push({ role_id: err });
        });
    } else {
      errors.push({ role_id: "Role_id is invalid." });
    }

    const newUser = {
      name: req.body.name,
      email: req.body.email,
      discord_id: req.body.discord_id,
      avatar: req.body.avatar,
      exp: req.body.exp,
      role_id: req.body.role_id
    };

    new Users(newUser)
      .save()
      .then(e => {
        res.send({ user: e });
      })
      .catch(err => {
        res.status(400).send({ error: err });
      });
  }
});

exports.atualizaUser = async (req, res) => {
  console.time("Atualizando com async/await:");
  const errors = [];

  const schema = Yup.object().shape({
    name: Yup.string(),
    email: Yup.string().email(),
    discord_id: Yup.string().max(5),
    avatar: Yup.string(),
    exp: Yup.number()
      .min(1)
      .max(50),
    // role_id: Yup.string().min(24).max(24),
    skill_id: Yup.string()
      .min(24)
      .max(24),
    team_id: Yup.string()
      .min(24)
      .max(24)
  });

  if (!(await schema.isValid(req.body))) {
    errors.push({ menseger: "Please enter your information" });
  }

  if (errors.length) {
    return res.status(401).send({ error: errors });
  } else {
    const { role_id } = await Users.findById(req.params.id);
    const { skills } = await Skill.find({
      user_id: req.params.id,
      role_id: role_id
    });

    const updatedUser = await Users.findOneAndUpdate(
      { _id: req.params.id },
      {
        ...req.body,
        score: !empty(skills)
          ? skills.reduce(
              (total, skill) => total + req.body.exp * skill.level,
              0
            )
          : 0
      },
      {
        new: true
      }
    );
    res.send(updatedUser);
    console.timeEnd("Atualizando com async/await:");
  }
};

module.exports = router;

/**
 * 
        // verificando se Team existe
        if (req.body.team_id.match(/^[0-9a-fA-F]{24}$/)) {
            Team.findById(req.body.team_id).then(team => {
                if (!team) {
                    errors.push({ team_id: 'Team_id does not exists. Please create a Team.' });
                }
            }).catch(err => {
                errors.push({ team_id: err });
            });
        } else {
            errors.push({ team_id: 'Team_id is invalid.' });
        }
 * 
 * MUDEI PARA ASYNC/AWAIT
 * router.put('/:id', (req, res) => {
    console.time(`Atualizando o usuário com id '${req.params.id}'`);
    Users.findById({_id: req.params.id}).populate('role_id').populate('skill_id').populate('team_id')
    .then(user => {
        const errors = [];
        if (req.body.name) {
            user.name = req.body.name;
        }
        if (req.body.email && req.body.email !== user.email) {
            if (validateEmail(req.body.email) && req.body.email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
                Users.findOne({ email: req.body.email }).then(user => {
                    if (user) {
                        errors.push({ email: 'User already exists' });
                    }
                }).catch(err => {
                    errors.push({ email: err });
                });
            } else {
                errors.push({ email: 'Email is invalid' });
            }
            user.email = req.body.email;
        }
        if (req.body.role_id) {
            // verificando se role_id existe
            if (req.body.role_id.match(/^[0-9a-fA-F]{24}$/)) {
                Roles.findById(req.body.role_id).then(role => {
                    if (!role) {
                        errors.push({ role_id: 'Role_id does not exists. Please create a Role.' });
                    }
                }).catch(err => {
                    errors.push({ role_id: err });
                });
            } else {
                errors.push({ role_id: 'Role_id is invalid.' });
            }
            user.role_id = req.body.role_id;
        }
        if (req.body.skill_id) {
            //TODO validar skills
            user.skill_id = req.body.skill_id;
        }
        if (req.body.exp) {
            user.exp = req.body.exp;
        }
        if (req.body.team_id) {
            //TODO validar se team_id é válido - verificando se Team existe
            if (req.body.team_id.match(/^[0-9a-fA-F]{24}$/)) {
                Team.findById(req.body.team_id).then(team => {
                    if (!team) {
                        errors.push({ team_id: 'Team_id does not exists. Please create a Team.' });
                    }
                }).catch(err => {
                    errors.push({ team_id: err });
                });
            } else {
                errors.push({ team_id: 'Team_id is invalid.' });
            }
            user.team_id = req.body.team_id;
        }
        if (req.body.discord_id) {
            user.discord_id = req.body.discord_id;
        }
        if (req.body.avatar) {
            user.avatar = req.body.avatar;
        }
        //TODO recalcular o score/exp total
        //user.score =  user.skills.reduce((total, skill) => total + (user.exp * skill.level), 0);

        user.populate('role_id').populate('skill_id').save().then(() => {
            res.send(user);
        }).catch(err => {
            res.send({error: `Aqui é o erro do save: ${err}` });
        })
    }).catch(err => {
        res.send({error: `Aqui é o erro do findById: ${err}` });
    })
    console.log("continua...");
    console.timeEnd(`Atualizando o usuário com id '${req.params.id}'`);
});

 */
