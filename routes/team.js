const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
require('../models/Team');
const Team = mongoose.model('teams');

router.get('/', (req, res) => {
    const team = {
        id: 0,
        name: 'Team 9'
    }
    res.send(team.json());
});

module.exports = router;