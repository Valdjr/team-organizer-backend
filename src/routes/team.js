const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
require('../models/Team');
const Team = mongoose.model('teams');
require('../models/User');
const User = mongoose.model('users');

const getAverageScore = function() {
    User.find().then(users => {
        const total = users.reduce((total, user) => total + user.score, 0);
        const average = total/user.length;
        return average;
    });
}

router.get('/all', (req, res) => {
    Team.find({}, { // campos escondidos
        __v: 0, createdAt: 0, updatedAt: 0
    }).then(teams => {
        res.send(teams);
    }).catch(err => {
        res.send({error: err});
    });
});

router.get('/:id', (req, res) => {
    Team.findById(req.params.id, { // campos escondidos
        __v: 0, createdAt: 0, updatedAt: 0
    }).then(teams => {
        res.send(teams);
    }).catch(err => {
        res.send({error: err});
    });
});

router.delete('/:id', (req, res) => {
    Team.findByIdAndRemove({_id: req.params.id}).then(team => {
        res.send({ ok: `Team '${team.name}' is deleted`});
    }).catch(err => {
        res.send({error: err});
    });
});

router.put('/:id', (req, res) => {
    Team.findById({_id: req.params.id}).then(team => {
        if (req.body.name && team.name !== req.body.name) {
            // verificando se Team existe
            Team.findOne({ name: req.body.name }).then(team => {
                if (team) {
                    res.send({ name: 'There is already a Team with that name' });
                }
            }).catch(err => {
                res.send({ name: err });
            });
            team.name = req.body.name;
        }
        if (req.body.project) {
            team.project = req.body.project
        }
        if (req.body.description) {
            team.description = req.body.description;
        }

        team.save().then(() => {
            res.send(team);
        }).catch(err => {
            res.send({error: `Aqui é o erro do save: ${err}` });
        });
    }).catch(err => {
        res.send({error: `Aqui é o erro do findById: ${err}` });
    });
});

router.post('/', async (req, res) => {
    const errors = [];
    if (!req.body.name) {
        errors.push({name: 'Name was not passed'});
    }

    // validar a Role
    
    // verificando se Team existe
    Team.findOne({ name: req.body.name }).then(team => {
        if (team) {
            errors.push({ name: 'Team already exists' });
        }
    }).catch(err => {
        errors.push({ name: err });
        
    });
    if (errors.length) {
        res.send({error: errors});
    } else {
        const newTeam = {
            name: req.body.name,
            project: req.body.project,
            description: req.body.description,
        };

        new Team(newTeam).save().then(e => {
            res.send(e);
        }).catch(err => {
            res.send({error: `Aqui é o erro do save: ${err}` });
        });
    }
});

router.post('/sort', (req, res) => {
    //TODO criação do time com o sorteio de usuários
    // const team_id = req.body.team_id;
    const minUsers = req.body.minUsers;
    const maxUsers = req.body.maxUsers;
    const roles = req.body.roles;
    const averageScore = getAverageScore();
    const sortUsers = [];
    const scoreSortUsers = 0;
    var finish = false;

    //pega os usuarios;
    roles.map((role) => {
        if (!finish) {
            for (var i=0; i < role.max; i++) {
                if (sortUsers.length < maxUsers) {
                    if (scoreSortUsers < averageScore) {
                        User.findOne({role_id: role.role_id, team_id: 0 /* verificar se o padrão vai ser 0 */}).then(user => {
                            sortUsers.push(user);
                            scoreSortUsers += user.score;
                        });
                    } else if (sortUsers.length > minUsers) {
                        // passou do score médio e atingiu o mínimo de users
                        finish = true;
                    } else {
                        // passou do score médio e não atingiu o mínimo de users
                        // pega o usuario com o menor score possivel
                        User.findOne({role_id: role.role_id, team_id: 0 /* verificar se o padrão vai ser 0 */}).sort({score}).then(user => {
                            sortUsers.push(user);
                            scoreSortUsers += user.score;
                        });
                    }
                } else {
                    finish = true;
                }
            }
        }
    });

    //salva os usuarios no time;
    console.log(sortUsers);

});

module.exports = router;
/**
 *     }).catch(err => {
            res.send({error: `Aqui é o erro do save: ${err}` });
        });
    }).catch(err => {
        res.send({error: `Aqui é o erro do findById: ${err}` });
    });
 */