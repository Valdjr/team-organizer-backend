const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
require('../models/Team');
const Team = mongoose.model('teams');

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

module.exports = router;
/**
 *     }).catch(err => {
            res.send({error: `Aqui é o erro do save: ${err}` });
        });
    }).catch(err => {
        res.send({error: `Aqui é o erro do findById: ${err}` });
    });
 */