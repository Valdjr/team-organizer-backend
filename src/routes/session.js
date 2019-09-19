require('dotenv/config');

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Yup = require('yup');
const mongoose = require('mongoose');
require('../models/User');
const User = mongoose.model('users');
const authConfig = require('../config/auth');

router.post('/', async (req, res) => {
  console.time('Required during');
  console.log('começando a rota Post da Session');
  const schema = Yup.object().shape({
    email: Yup.string().email().required(),
  });

  if (!(await schema.isValid(req.body))) {
    console.timeEnd('Required during');
    return res.status(400).send({ error: 'Validation fails' });
  }
  
  const user = await User.findOne({ email: req.body.email });
  
  if (!user) {
    console.timeEnd('Required during');
    return res.status(400).send({ error: 'User not exists' });
  }

  console.log(user);
  console.timeEnd('Required during');
  return res.send({
    User: {
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    },/*
    token: jwt.sign({ user.email }, authConfig.secret, {
      expiresIn: authConfig.expiresIn,
    }), */
  });
});

module.exports = router;
