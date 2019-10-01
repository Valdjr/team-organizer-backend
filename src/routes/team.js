const express = require("express");
const router = express.Router();
const empty = require("is-empty");
const mongoose = require("mongoose");
require("../models/Team");
require("../models/Users");
require("../models/Settings");
const Team = mongoose.model("teams");
const User = mongoose.model("users");
const Settings = mongoose.model("settings");

const getAverageScore = async () => {
  const users = await User.find();
  const total = users.reduce((total, user) => total + user.score, 0);
  const average = total / users.length;

  return average;
};

const usersRole = async role => {
  const users = await User.find({
    team_id: [undefined, null],
    role_id: role
  }).sort({ score: 1 });

  const sorteio = Math.floor(Math.random() * users.length);

  const listId = users.map(user => {
    return {
      id: user._id,
      score: user.score
    };
  });

  return listId[sorteio];
};

const usuariosPorTime = async () => {
  const totalUsers = await User.find().count();
  const { minUser, maxUser } = await Settings.findOne();
  const usersPorTime = []; 
  for (var i=maxUser; i>=minUser; i--) {
    var numeroDeTimes = parseInt(totalUsers/i);
    var resto = totalUsers%i;
    if (resto >= minUser) {
      usersPorTime.push({users: i, numeroDeTimes: numeroDeTimes, sucesso: true, usersNoUltimoTime: resto});
    } else {
      usersPorTime.push({users: i, numeroDeTimes: numeroDeTimes, sucesso: false, usersNoUltimoTime: resto, falta: minUser-resto});
    }
  }
  return usersPorTime;
}

router.get("/usuariosPorTime", async (req, res) => {
  const usersPorTime = await usuariosPorTime();
  res.json(usersPorTime);
});

router.get("/all", (req, res) => {
  Team.find(
    {},
    {
      // campos escondidos
      __v: 0,
      createdAt: 0,
      updatedAt: 0
    }
  )
    .then(teams => {
      res.send(teams);
    })
    .catch(err => {
      res.send({ error: err });
    });
});

router.get("/:id", (req, res) => {
  Team.findById(req.params.id, {
    // campos escondidos
    __v: 0,
    createdAt: 0,
    updatedAt: 0
  })
    .then(teams => {
      res.send(teams);
    })
    .catch(err => {
      res.send({ error: err });
    });
});

/* usar apenas quando for apagar tudo*/
router.delete("/all", async (req, res) => {
  console.log("Apagando todos os Teams");
  const teams = await Team.find();

  await teams.map(async (deleted, index) => {
    console.log(`aqui deve ser o id: ${deleted._id}, e o index é ${index}`);
    const users = await Team.find();

    await users.map(async (deleted, index) => {
      await User.findByIdAndUpdate(
        { _id: deleted._id },
        {
          team_id: undefined
        }
      );
    });

    await Team.findByIdAndDelete(deleted._id);
  });

  return res.send({ ok: `Foram apagados ${teams.length}` });
}); /**/

router.delete("/:id", (req, res) => {
  Team.findByIdAndRemove({ _id: req.params.id })
    .then(team => {
      res.send({ ok: `Team '${team.name}' is deleted` });
    })
    .catch(err => {
      res.send({ error: err });
    });
});

router.put("/:id", (req, res) => {
  Team.findById({ _id: req.params.id })
    .then(team => {
      if (req.body.name && team.name !== req.body.name) {
        // verificando se Team existe
        Team.findOne({ name: req.body.name })
          .then(team => {
            if (team) {
              res.send({ name: "There is already a Team with that name" });
            }
          })
          .catch(err => {
            res.send({ name: err });
          });
        team.name = req.body.name;
      }
      if (req.body.project) {
        team.project = req.body.project;
      }
      if (req.body.description) {
        team.description = req.body.description;
      }

      team
        .save()
        .then(() => {
          res.send(team);
        })
        .catch(err => {
          res.send({ error: `Aqui é o erro do save: ${err}` });
        });
    })
    .catch(err => {
      res.send({ error: `Aqui é o erro do findById: ${err}` });
    });
});

router.post("/", async (req, res) => {
  const errors = [];
  if (!req.body.name) {
    errors.push({ name: "Name was not passed" });
  }

  // validar a Role

  // verificando se Team existe
  Team.findOne({ name: req.body.name })
    .then(team => {
      if (team) {
        errors.push({ name: "Team already exists" });
      }
    })
    .catch(err => {
      errors.push({ name: err });
    });
  if (errors.length) {
    res.send({ error: errors });
  } else {
    const newTeam = {
      name: req.body.name,
      project: req.body.project,
      description: req.body.description
    };

    new Team(newTeam)
      .save()
      .then(e => {
        res.send(e);
      })
      .catch(err => {
        res.send({ error: `Aqui é o erro do save: ${err}` });
      });
  }
});

router.post("/montarTime", async (req, res) => {
  const { minUser, maxUser, roles } = await Settings.findOne();
  const averageScore = (await getAverageScore()) * maxUser;
  const sortUsers = [];
  var scoreSortUsers = 0;
  var finish = false;

  if (!finish) {
    // percorrendo a 1ª role
    for (var i = 0; i < roles[0].maxRole; i++) {
      if (sortUsers.length < maxUser) {
        if (scoreSortUsers < averageScore) {
          const t = await usersRole(roles[0].role_id);
          sortUsers.push(t.id);
          scoreSortUsers += t.score;
        } else if (sortUsers.length > minUser) {
          finish = true;
        } else {
          const t = await usersRole(roles[0].role_id);
          sortUsers.push(t.id);
          scoreSortUsers += t.score;
        }
      } else {
        finish = true;
      }
    }

    // percorrendo a 2ª role
    for (var i = 0; i < roles[1].maxRole; i++) {
      if (sortUsers.length < maxUser) {
        if (scoreSortUsers < averageScore) {
          const t = await usersRole(roles[1].role_id);
          sortUsers.push(t.id);
          scoreSortUsers += t.score;
        } else if (sortUsers.length > minUser) {
          finish = true;
        } else {
          const t = await usersRole(roles[1].role_id);
          sortUsers.push(t.id);
          scoreSortUsers += t.score;
        }
      } else {
        finish = true;
      }
    }

    // percorrendo a 3ª role
    for (var i = 0; i < roles[2].maxRole; i++) {
      if (sortUsers.length < maxUser) {
        if (scoreSortUsers < averageScore) {
          const t = await usersRole(roles[2].role_id);
          sortUsers.push(t.id);
          scoreSortUsers += t.score;
        } else if (sortUsers.length > minUser) {
          finish = true;
        } else {
          const t = await usersRole(roles[2].role_id);
          sortUsers.push(t.id);
          scoreSortUsers += t.score;
        }
      } else {
        finish = true;
      }
    }

    // percorrendo a 4ª role
    for (var i = 0; i < roles[3].maxRole; i++) {
      if (sortUsers.length < maxUser) {
        if (scoreSortUsers < averageScore) {
          const t = await usersRole(roles[3].role_id);
          sortUsers.push(t.id);
          scoreSortUsers += t.score;
        } else if (sortUsers.length > minUser) {
          finish = true;
        } else {
          const t = await usersRole(roles[3].role_id);
          sortUsers.push(t.id);
          scoreSortUsers += t.score;
        }
      } else {
        finish = true;
      }
    }

    // percorrendo a 5ª role
    for (var i = 0; i < roles[4].maxRole; i++) {
      if (sortUsers.length < maxUser) {
        if (scoreSortUsers < averageScore) {
          const t = await usersRole(roles[4].role_id);
          sortUsers.push(t.id);
          scoreSortUsers += t.score;
        } else if (sortUsers.length > minUser) {
          finish = true;
        } else {
          const t = await usersRole(roles[4].role_id);
          sortUsers.push(t.id);
          scoreSortUsers += t.score;
        }
      } else {
        finish = true;
      }
    }
  }

  const teams = await Team.find();
  const name = `Team ${teams.length + 1}`;

  const newTeam = {
    name,
    users: sortUsers,
    score: scoreSortUsers
  };
  const createdTeam = await new Team(newTeam).save().catch(err => {
    err;
  });
  console.log(createdTeam);

  sortUsers.map(async e => {
    await User.findByIdAndUpdate(
      { _id: e },
      { team_id: createdTeam._id },
      { new: true }
    );
  });

  /*await User.findByIdAndUpdate(
    { _id: { $in: sortUsers.map(e => e) } },
    { team_id: createdTeam._id }
  );*/

  return res.send(createdTeam);
});

module.exports = router;
/**
 *     }).catch(err => {
            res.send({error: `Aqui é o erro do save: ${err}` });
        });
    }).catch(err => {
        res.send({error: `Aqui é o erro do findById: ${err}` });
    });

     function randomColor ( colors ) {
       return colors [ Math.floor(Math.random() * colors.length)];
      } 
 */
