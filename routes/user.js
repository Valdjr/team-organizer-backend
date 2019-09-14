const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
require('../models/User');
const User = mongoose.model('users');

router.get('/', (req, res) => {
    const user = {
        id: 0,
        name: 'Valdir',
        discord_id: 0,
        avatar: '',
        role: 'dev',
        skills: {
            tool: 'php',
            years: 3
        },
        team_id: 0
    }
    res.send(user);
});

module.exports = router;