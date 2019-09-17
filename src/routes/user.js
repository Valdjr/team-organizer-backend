const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
require('../models/User');
const User = mongoose.model('users');
require('../models/Team');
const Team = mongoose.model('teams');
require('../models/Role');
const Role = mongoose.model('roles');

const validateEmail = function(email) {
    let re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    console.log(`validateEmail => ${re.test(email)}!!`);
    return re.test(email)
};

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
        const errors = [];
        if (req.body.name) {
            user.name = req.body.name;
        }
        if (req.body.email && req.body.email !== user.email) {
            if (validateEmail(req.body.email) && req.body.email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
                User.findOne({ email: req.body.email }).then(user => {
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
                Role.findById(req.body.role_id).then(role => {
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
        if (req.body.skills) {
            //TODO validar skills
            user.skills = req.body.skills;
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
        user.score =  user.skills.reduce((total, skill) => total + (user.exp * skill.level), 0);

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
    if (!req.body.email) {
        errors.push({ email: 'Email was not passed' });
    }
    if (!req.body.role_id) {
        errors.push({role_id: 'Role_id was not passed'});
    }
    if (!req.body.skills) {
        errors.push({skills: 'Skills was not passed'});
    }
    if (!req.body.team_id) {
        errors.push({team_id: 'Team_id was not passed'});
    }
    //TODO validar se as skills são válidas
    
    // verificando se usuário já existe, através do nome. PS: ACHO QUE PODE SER APAGADO
    User.findOne({ name: req.body.name }).then(user => {
        if (user) {
            errors.push({ name: 'User already exists' });
        }
    }).catch(err => {
        errors.push({ name: err });
    });
    
    // verificando se existe User, através do e-mail
    if (validateEmail(req.body.email) && req.body.email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
        User.findOne({ email: req.body.email }).then(user => {
            if (user) {
                errors.push({ email: 'User already exists' });
            }
        }).catch(err => {
            errors.push({ email: err });
        });
    } else {
        errors.push({ email: 'Email is invalid' });
    }

    // verificando se role_id existe
    if (req.body.role_id.match(/^[0-9a-fA-F]{24}$/)) {
        Role.findById(req.body.role_id).then(role => {
            if (!role) {
                errors.push({ role_id: 'Role_id does not exists. Please create a Role.' });
            }
        }).catch(err => {
            errors.push({ role_id: err });
        });
    } else {
        errors.push({ role_id: 'Role_id is invalid.' });
    }
    
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
    
    // validando erros
    if (errors.length) {
        return res.status(400).send({error: errors});
    } else {
        const newUser = {
            name: req.body.name,
            email: req.body.name,
            role_id: req.body.role_id,
            skills: req.body.skills,
            team_id: req.body.team_id,
            discord_id: req.body.discord_id,
            avatar: req.body.avatar,
            exp: req.body.exp,
            score: req.body.skills.reduce((total, skill) => total + (this.exp * skill.level), 0)
        }
        new User(newUser).save().then(() => {
            res.send({error: false});
        }).catch(err => {
            res.send({error: err});
        });
    }
});

module.exports = router;