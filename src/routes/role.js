const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
require('../models/Role');
const Role = mongoose.model('roles');

router.get('/all', (req, res) => {
  Role.find().then(rotes => {
    res.send(rotes);
  }).catch(err => {
    res.send({ error: err });
  });
});

router.get('/:id', (req, res) => {
  Role.findById(req.params.id).then(role => {
    res.send(role);
  }).catch(err => {
    res.send({ error: err });
  });
});

router.delete('/:id', (req, res) => {
  Role.findByIdAndDelete({ _id: req.params.id }).then(role => {
    res.send(role);
  }).catch(err => {
    res.send({ error: err });
  });
});

router.put('/:id', (req, res) => {
  Role.findByIdAndUpdate({ _id: req.params.id }).then(role => {
    if (req.body.name) {
      Role.findOne({ name: req.body.name }).then(role => {
        if (role) {
          res.send({ name: 'There is already a Role with that name' });
        }
      }).catch(err => {
        res.send({ error: err });
      });
      role.name = req.body.name;
    }

    role.save().then(() => {
      res.send({ error: false });
    }).catch(err => {
      res.send({ error: err });
    });

  }).catch(err => {
    res.send({ error: err });
  });
});

router.post('/', (req, res) => {
  const errors = [];
  if (!req.body.name) {
    errors.push({ name: 'Name was not passed' });
  }

  //verificando se Role existe
  Role.findOne({ name: req.body.name }).then(role => {
    if (role) {
        errors.push({ name: 'Role already exists' });
    }
  }).catch(err => {
    errors.push({ name: err });
  });

  if (errors.length) {
    res.send({error: errors});
  } else {
    const newRole = {
        name: req.body.name
    };

    new Role(newRole).save().then(() => {
        res.send({error: false});
    }).catch(err => {
        res.send({error: err});
    });
  }
});

module.exports = router;
