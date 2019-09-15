const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
require('../models/Team');
const Team = mongoose.model('teams');

router.get('/all', (req, res) => {
    Team.find().then(teams => {
        res.send(teams);
    }).catch(err => {
        res.send({error: err})
    });
});

router.get('/:id', (req, res) => {
    Team.findById(req.params.id).then(teams => {
        res.send(teams);
    }).catch(err => {
        res.send({error: err})
    });
});

router.delete('/:id', (req, res) => {
    Team.findByIdAndRemove({_id: req.params.id}).then(team => {
        res.send(team);
    }).catch(err => {
        res.send({error: err})
    });
});

router.put('/:id', (req, res) => {
    Team.findById({_id: req.params.id}).then(team => {
        if (req.body.name) {
            team.name = req.body.name;
        }
        team.save().then(() => {
            res.send({error: false});
        }).catch(err => {
            req.send({error: err});
        })
    }).catch(err => {
        req.send({error: err});
    })
});

router.post('/', async (req, res) => {
    const errors = [];
    if (!req.body.name) {
        errors.push({name: 'Name was not passed'});
    }
    
    if (await Team.findOne({ name: req.body.name })) {
        return res.status(400).json({ error: 'Team already exists' })
    }
    if (errors.length) {
        res.send({error: errors});
    } else {
        const newTeam = {
            name: req.body.name
        };

        new Team(newTeam).save().then(() => {
            res.send({error: false});
        }).catch(err => {
            res.send({error: err});
        });
    }
});

module.exports = router;