const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const empty = require('is-empty');
require('../models/Settings');
const Settings = mongoose.model('settings');

router.get(['/', '/:id'], async (req, res) => {
  const { id } = req.params;
  const { filter, search, sort } = req.query;

  const reg = new RegExp("^" + (!empty(search) ? search : ""));
  const filterBy = !empty(id)
    ? { _id: id }
    : !empty(filter)
    ? { [filter]: reg }
    : {};

  let settings = await Settings.find(filterBy)
    .populate('role_id')
    .catch(err => {
      res.status(400).send({ error: err });
    });

  if (empty(id) && !empty(sort)) {
    switch (sort) {
      case "roles":
        let roles = await Roles.find({}).sort("name");
        settings = roles
          .map(({ name, _id: id }) => ({
            name: name.toUpperCase(),
            id,
            settings: Settings.filter(user => {
              return String(id) == String(user.role_id._id);
            })
          }))
          .filter(group => group.settings.length > 0);
        break;
      case "exp":
        let exps = settings.map(user => user.exp);
        exps = exps.filter((exp, pos) => exps.indexOf(exp) === pos);

        settings = exps.map(exp => {
          const new_settings = settings.filter(user => user.exp === exp);
          return { id: exp, name: `${exp}`, exp: true, settings: new_settings };
        });

        break;
      default:
    }
  }

  return res.send(settings);
});

router.delete('/', async (req, res) => {
  const deletedSettings = await Settings.findByIdAndDelete();

  if (!deletedSettings) {
    return res.status(404).send({ error: 'No Settings to delete' });
  }

  return res.send({ ok: `Setting '${deletedSettings._id}' deleted`});
});

router.put('/:id', async (req, res) => {
  const errors = [];
  if (empty(req.body)) {
    return res.status(400).send({ error: "No fields are filled" });
  }

  let { name, minUser, maxUser } = await Settings.findById(req.params.id);

  if (req.body.newName && req.body.newName !== name) {
    name = req.body.newName;
  }
  if (req.body.newMinUser && req.body.newMinUser !== minUser) {
    minUser = req.body.newMinUser;
  }
  if (req.body.newMaxUser && req.body.newMaxUser !== maxUser) {
    maxUser = req.body.newMaxUser;
  }

  const roles = await req.body.roles.map((role, index) => {
    if (role.newMinRole && role.minRole !== role.newMinRole) {
      role.minRole = role.newMinRole;
    }
    if (role.newMaxRole && role.maxRole !== role.newMaxRole) {
      role.maxRole = role.newMaxRole;
    }
    
    return role;
  });
  
  if (errors.length) {
    return res.status(402).send(errors);
  } else {
    const updatedSettings = await Settings.findOneAndUpdate(req.params.id, {
      name,
      minUser,
      maxUser,
      roles,
    }, { new: true });
    if (!updatedSettings) {
      return res.status(404).send({ error: 'Setting not found' })
    }
    
    return res.send({ updatedSkill, score: updatedUser.score });
  }
});

router.post('/', async (req, res) => {
  const errors = [];
  if (empty(req.body)) {
    errors.push({ body: "No fields are filled" });
  } else {
    if (empty(req.body.name)) {
      errors.push({ minUser: "name was not passed" });
    }
    if (empty(req.body.minUser)) {
      errors.push({ minUser: "minUser was not passed" });
    }
    if (empty(req.body.maxUser)) {
      errors.push({ maxUser: "maxUser was not passed" });
    }
    if (empty(req.body.roles)) {
      errors.push({ roles: "roles was not passed" });
    } else {
      await req.body.roles.map((num, index) => {
        if (empty(num.role_id)) {
          errors.push({ role_id: `role_id was not passed in ${index} position` });
        }
        if (empty(num.minRole)) {
          errors.push({ minRole: `minRole was not passed in ${index+1} position` });
        }
        if (empty(num.maxRole)) {
          errors.push({ maxRole: `maxRole was not passed in ${index+1} position` });
        }
      });
    }
  }
  
  if (errors.length) {
    return res.status(402).send(errors);
  } else {
    const newSetting = await new Settings(req.body).save()
      .catch(err => res.status(400).send({ error: err }));

    if (!newSetting) {
      return res.status(403).res({ error: 'Unable to save Configuration' });
    }
    return res.send({ newSetting });
  }
});

module.exports = router;