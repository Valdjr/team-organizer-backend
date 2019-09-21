const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
require('../models/User');
const User = mongoose.model('users');

const getAverageScore = function() {
    User.find().then(users => {
        const total = users.reduce((total, user) => total + user.score, 0);
        const average = total/user.length;
        return average;
    });
}

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

router.get('/all', (req, res) => {
    User.find().then(users => {
        res.send(users);
    }).catch(err => {
        res.send({error: err})
    });
});

router.get('/:id', (req, res) => {
    User.findById(req.params.id).then(user => {
        res.send(user);
    }).catch(err => {
        res.send({error: err})
    });
});

router.delete('/:id', (req, res) => {
    User.findByIdAndRemove({_id: req.params.id}).then(user => {
        res.send(user);
    }).catch(err => {
        res.send({error: err})
    });
});

router.put('/:id', (req, res) => {
    User.findById({_id: req.params.id}).then(user => {
        if (req.body.name) {
            user.name = req.body.name;
        }
        if (req.body.role) {
            user.role = req.body.role;
        }
        if (req.body.skills) {
            //TODO validar skills
            user.skills = req.body.skills;
        }
        if (req.body.exp) {
            user.exp = req.body.exp;
        }
        if (req.body.team_id) {
            //TODO validar se team_idé válido
            user.team_id = req.body.team_id;
        }
        if (req.body.discord_id) {
            user.discord_id = req.body.discord_id;
        }
        if (req.body.avatar) {
            user.avatar = req.body.avatar;
        }
        //TODO recalcular o score/exp total
        user.save().then(() => {
            res.send({error: false});
        }).catch(err => {
            req.send({error: err});
        })
    }).catch(err => {
        req.send({error: err});
    })
});

router.post('/', (req, res) => {
    const errors = [];
    if (!req.body.name) {
        errors.push({name: 'Name was not passed'});
    }
    if (!req.body.role) {
        errors.push({role: 'Role was not passed'});
    }
    if (!req.body.skills) {
        errors.push({skills: 'Skills was not passed'});
    }
    if (!req.body.exp) {
        errors.push({exp: 'Exp was not passed'});
    }
    if (!req.body.team_id) {
        errors.push({team_id: 'Team_id was not passed'});
    }
    //TODO validar se as skills são válidas
    //TODO validar se o team_id existe
    //TODO calcular o score/exp total
    if (errors.length) {
        res.send({error: errors});
    } else {
        const newUser = {
            name: req.body.name,
            role: req.body.role,
            skills: req.body.skills,
            exp: req.body.exp,
            team_id: req.body.team_id,
            discord_id: req.body.discord_id,
            avatar: req.body.avatar
        }
        new User(newUser).save().then(() => {
            res.send({error: false});
        }).catch(err => {
            res.send({error: err});
        });
    }
});

module.exports = router;