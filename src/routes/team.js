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

/* acha a média da pontuação */
const getAverageScore = async () => {
  const users = await User.find();
  const total = users.reduce((total, user) => total + user.score, 0);
  const average = total / users.length;

  return average;
};

const getScoresTeam = async qtdUsers => {
  const teams = await Team.find();
  const average = Math.floor((await getAverageScore()) * qtdUsers);

  return {
    max: teams.sort((a, b) => {
      if (!empty(a) && !empty(b)) {
        return b.scoreTeam - a.scoreTeam;
      }
    })[0].scoreTeam,
    average,
    min: teams.sort((a, b) => {
      if (!empty(a) && !empty(b)) {
        return a.scoreTeam - b.scoreTeam;
      }
    })[0].scoreTeam
  };
};

/* traz apenas 1 usuário de forma randômica da "role" */
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

const maxRole = async role => {
  const { roles } = await Settings.findOne();
  const { maxRole } = roles.find(r => (r.role_id = role));

  return maxRole;
};

/* achar o usuário com o maior score sem time */
const getUserMaxScore = async () => {
  const users = [];
  const { roles } = await Settings.findOne();
  for (let i = 0; i < roles.length; i++) {
    users.push(
      await User.findOne(
        {
          team_id: [undefined, null],
          role_id: roles[i].role_id
        },
        {
          name: 1,
          email: 1,
          score: 1,
          role_id: 1,
          team_id: 1
        }
      ).sort({ score: -1 })
    );
  }

  if (!empty(users)) {
    /* retorna o maior score de cada role, já organizado pelo maior score */
    return users.sort((a, b) => {
      if (!empty(a) && !empty(b)) {
        return b.score - a.score;
      }
    });
  }
};

/* achar o usuário com o menor score sem time */
const getUserMinScore = async () => {
  const users = [];
  const { roles } = await Settings.findOne();

  for (let i = 0; i < roles.length; i++) {
    users.push(
      await User.findOne(
        {
          team_id: [undefined, null],
          role_id: roles[i].role_id
        },
        {
          name: 1,
          email: 1,
          score: 1,
          role_id: 1,
          team_id: 1
        }
      ).sort({ score: 1 })
    );
  }

  if (!empty(users)) {
    /* retorna o menor score de cada role, já organizado pelo menor score */
    return await users.sort((a, b) => {
      if (!empty(a) && !empty(b)) {
        return a.score - b.score;
      }
    });
  }
  return console.log("Não existem mais usuários para criação de times");
};

/* encontra a melhor quantidade de usuários por times */
const usuariosPorTime = async () => {
  const totalUsers = await User.find().count();
  const { minUser, maxUser } = await Settings.findOne();
  const usersPorTime = [];
  for (var i = maxUser; i >= minUser; i--) {
    var numeroDeTimes = parseInt(totalUsers / i);
    var resto = totalUsers % i;
    if (resto >= minUser || resto == 0) {
      usersPorTime.push({
        qtdUsers: totalUsers,
        users: i,
        numeroDeTimes: numeroDeTimes,
        sucesso: true,
        usersNoUltimoTime: resto
      });
    } else {
      usersPorTime.push({
        qtdUsers: totalUsers,
        users: i,
        numeroDeTimes: numeroDeTimes,
        sucesso: false,
        usersNoUltimoTime: resto,
        falta: minUser - resto
      });
    }
  }
  return usersPorTime;
};

/* criação de time balanceado */
router.post("/balanceado", async (req, res) => {
  const teste = [];
  /* pegando o nº máximo de usuários por time */
  const usersPorTime = await usuariosPorTime();

  /**
   * Score máximo ideal para o time
   * ( Média dos Users * QtdUsers para cada time ) * 15%
   * essa % foi a qual eu achei mais próximos dos users que temos hoje
   * "scoresTeams": {
   *  "max": 931, # 19,36%
   *  "average": 780,
   *  "min": 652  # 16,41%
   * }
   */
  const averageScore = Math.floor(
    (await getAverageScore()) * usersPorTime[0].users * 1.15
  );

  /* enquanto não for criado todos os times, continue */
  for (let j = 0; j < usersPorTime[0].numeroDeTimes; j++) {
    /* ordenando os usuários por score e por role */
    const listMinScores = await getUserMinScore();
    const listMaxScores = await getUserMaxScore();
    var users = [];

    /* verificando as ordenações e quantidades de usuário por time */
    if (empty(listMinScores)) {
      return res.status(400).send({
        error: `Não existem mais usuários com o mínimo de Score para criação de times`
      });
    }

    if (empty(listMaxScores)) {
      return res.status(400).send({
        error: `Não existem mais usuários com o máximo de Score para criação de times`
      });
    }

    /**
     * devemos decidir como será passado a escolha do admin do sistema
     * será por req.query, req.params ou req.body?
     * no momento apenas confirmei que será a 1ª opção usersPorTime[0]
     */
    // enquanto não chegar no máximo de usuários, continue
    for (var i = 0; i < usersPorTime[0].users; i++) {
      if (users.length < usersPorTime[0].users) {
        // soma dos Scores dos users que estão no time que será criado
        var sumScore = users.reduce((acc, cur) => acc + cur.score, 0);

        // verifica se a lista dos menores scores não é vazia
        if (!empty(listMinScores[i])) {
          const qtdRoleMinTeam = users.reduce((acc, cur) => {
            if (cur.role_id == listMinScores[i].role_id) {
              acc += 1;
            }
            return acc;
          }, 0);

          // verifica se essa role já existe no time
          if (!users.some(n => n.role_id == listMinScores[i].role_id)) {
            /* se não existe, incluí o usuário */
            users.push(listMinScores[i]);
          } else if (qtdRoleMinTeam < maxRole(listMinScores[i].role_id)) {
            /* se existe verifica se a quantidade de users com essa role já chegou ao máximo */
            users.push(listMinScores[i]);
          }
        }

        // verifica se a soma dos scores é menor que a média aceita
        if (sumScore < averageScore) {
          if (!empty(listMaxScores[i])) {
            if (sumScore + listMaxScores[i].score <= averageScore) {
              const qtdRoleMaxTeam = users.reduce((acc, cur) => {
                if (cur.role_id == listMaxScores[i].role_id) {
                  acc += 1;
                }
                return acc;
              }, 0);

              /* verifica se essa role já existe no time */
              if (!users.some(n => n.role_id == listMaxScores[i].role_id)) {
                /* se não existe, incluí o usuário */
                users.push(listMaxScores[i]);
              } else if (qtdRoleMaxTeam < maxRole(listMaxScores[i].role_id)) {
                /* se existe verifica se a quantidade de users com essa role já chegou ao máximo */
                users.push(listMaxScores[i]);
              }
            }
          }
        }
      }
    }

    const teams = await Team.find();
    /* verifica se já existe a quantidade total de times */
    if (teams.length < usersPorTime[0].numeroDeTimes + 1) {
      const name = `Team ${teams.length + 1}`;

      /* cria o time no MongoDB */
      const newTeam = await new Team({
        name,
        scoreTeam: users.reduce((acc, cur) => acc + cur.score, 0),
        users
      })
        .save()
        .catch(err => res.status(400).send(err));

      /* atualiza o campo team_id dos usuários do time que foi criado */
      const updatedUsers = users.map(async u => {
        await User.findByIdAndUpdate(
          { _id: u._id },
          { team_id: newTeam._id },
          { new: true }
        );
      });
      //return res.send(newTeam);
      teste.push(newTeam);
    }
  }

  if (!teste) {
    return res
      .status(400)
      .send({ error: `Não existem mais usuários para criar time!` });
  }

  return res.send({ qtd: teste.length });
});

/* rota para encontrar a melhor quantidade de usuários por time */
router.get("/usuariosPorTime", async (req, res) => {
  const usersPorTime = await usuariosPorTime();
  res.json(usersPorTime);
});

/* rota para trazer TODOS os times */
router.get("/all", async (req, res) => {
  const teams = await Team.find(
    {},
    { __v: 0, createdAt: 0, updatedAt: 0, users: 0 }
  );

  if (empty(teams)) {
    return res.status(402).send({ error: "Não existe nenhum time" });
  }
  const scoresTeams = await getScoresTeam(8);

  return res.send({ scoresTeams, teams });
});

/* rota para trazer 1 time */
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
  const qtdUsers = 0;

  if (!empty(teams)) {
    await teams.map(async (deleted, index) => {
      console.log(`Apagando o time: ${deleted._id}, e o index é ${index}`);
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
  } else {
    const users = await User.find();

    users.map(async (deleted, index) => {
      console.log(`Ajustando o user: ${deleted._id}, e o index é ${index}`);
      await User.findByIdAndUpdate(
        { _id: deleted._id },
        {
          team_id: undefined
        }
      );
    });
  }

  return res.send({
    ok: `Foram apagados ${teams.length} times`
  });
}); /**/

/* rota para apagar 1 time */
router.delete("/:id", (req, res) => {
  Team.findByIdAndRemove({ _id: req.params.id })
    .then(team => {
      res.send({ ok: `Team '${team.name}' is deleted` });
    })
    .catch(err => {
      res.send({ error: err });
    });
});

/* rota para atualizar 1 time */
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

/**
 * rota para criar 1 time
 * NÃO UTILIZAR
 */
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

/* rota para montar 1 time aleatório, sem nenhum balanceamento */
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
