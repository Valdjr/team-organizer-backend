const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
require('../models/Skill');
require('../models/Role');
require('../models/User');
const Skill = mongoose.model('skills');
const Role = mongoose.model('roles');
const User = mongoose.model('users');

router.get('/:user_id/all', (req, res) => {
  console.log(`Chamou todos os Skills. ${req}`);
  Skill.find({user_id: req.params.user_id}).then(skills => {
    if (!skills.length) {
      res.status(404).send({vazio: 'Não existe nenhuma Skill cadastrada'});
    }
    res.send(skills);
  }).catch(err => {
    res.status(400).send({ error: `Aqui é o erro do find: ${err}` });
  });
});

router.get('/:user_id/:id', (req, res) => {});

router.delete('/:user_id/:id', (req, res) => {});

router.put('/:user_id/:id', (req, res) => {});

router.post('/:user_id/', (req, res) => {
  const errors = [];
  if (!req.body.skills) {
    errors.push({ skills: 'Skills was not passed' });
  }

  const arr = req.body.skills;
  const teste = arr.forEach((skill, index) => {
    
    //  res.send({skill_name: `Skill Name was not passed in position ${index}`});
    
    res.send({ ok: `Nome: '${skill.name}' posição '${index}'` });
  });
  return res.send(teste);
  if (req.body.skills.filter(skill => skill.name === null)) {
    errors.push({ skill_name: 'Name Skill was not passed' });
  }
  
  if (req.body.skills.filter(skill => skill.level === null)) {
    errors.push({ skill_level: 'Level Skill was not passed' });
  }

  if (!req.body.role_id) {
    errors.push({ role_id: 'Role was not passed' });
  }
  return res.send(errors);
});

module.exports = router;