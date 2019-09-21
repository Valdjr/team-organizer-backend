const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
require('../models/Skill');
require('../models/Role');
require('../models/User');
const Skill = mongoose.model('skills');
/*const Role = mongoose.model('roles');
const User = mongoose.model('users');*/

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

router.get('/:id', (req, res) => {
  console.log(`Chamou o Skill '${req.params.id}'`);
  const list = Skill.findById(req.params.id).then(skills => {
    res.send(skills);
  }).catch(err => err);
  res.send(list);
});

router.delete('/:id', (req, res) => {
  console.log(`Apagou o Skill '${req.params.id}'`);
  const deleteSkill = Skill.findByIdAndDelete(req.params.id).then(e => {
    //console.log(e._id);
    res.send({ OK: `A Skill ID: ${e._id} foi apagada` })
  }).catch(err => err);
  res.send(deleteSkill);
});

router.put('/:id', async (req, res) => {
  const errors = [];
  if (!req.body) {
    return res.status(400).send({ error: 'No fields are filled' });
  }

  const skills = await req.body.skills.map((num, index) => {
    if (index < req.body.skills.length) {
      if (num.name) {
        if (num.newName) {
          num.name = num.newName;
        }
        if (num.newLevel) {
          num.level = num.newLevel;
        }
      }
      if (!num.name) {
        errors.push({ name: 'Name not found' });
      }
      return num;
    }
  });
  
  if (errors.length) {
    return res.status(402).send(errors);
  }

  const updatedSkill = await Skill.findByIdAndUpdate({
    _id: req.params.id,
    role_id: req.body.role_id,
  }, {
    skills: skills
  });

  return res.send(updatedSkill);
});

router.post('/', (req, res) => {
  const errors = [];
  if (!req.body.skills) {
    errors.push({ skills: 'Skills was not passed' });
  }

  const skills = req.body.skills.map((num, index) => {
    if (index < req.body.skills.length) {
      if (num.name === undefined) {
        errors.push({ error: `O campo NAME não foi preenchido no ${index+1}º skill` });
      }
      if (num.level === undefined) {
        errors.push({ error: `O campo LEVEL não foi preenchido no ${index+1}º skill` });
      }
      return num;
    }
  });

  if (!req.body.role_id) {
    errors.push({ role_id: 'Role was not passed' });
  }
  const newSkill = {
    skills,
    role_id: req.body.role_id,
    user_id: req.params.user_id,
  }
  //return res.send({ ok: newSkill })
  if (errors.length) {
    res.status(400).send({ error: errors });
  } else {
    
    new Skill(newSkill).save().then(e => {
      res.send(e);
    }).catch(err => {
      res.status(400).send({ error: `Aqui é o erro do save: ${err}` })
    });
  }
});

module.exports = router;