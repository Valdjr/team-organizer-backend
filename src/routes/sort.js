const express = require('express');
const router = express.Router();
const empty = require('is-empty');
const mongoose = require('mongoose');
require('../models/Users');
require('../models/Team');
require('../models/Settings');
require('../models/Roles');
const User = mongoose.model('users');
const Team = mongoose.model('teams');
const Settings = mongoose.model('settings');
const Role = mongoose.model('roles');

router.post('/', async (req, res) => {
  /*var usuarios = usuarioService.Usuarios.Find(new BsonDocument()).ToList()
  .Where(usuario => usuario.team_id == null).ToList();*/
  const usuarios = await User.find({ team_id: [undefined, null] });

  //var teams = usuarioService.Teams.Find(new BsonDocument()).ToList().ToArray();
  const teams = await Team.find();

  //var roles = usuarioService.Roles.Find(new BsonDocument()).ToList().ToArray();
  const roles = await Role.find();

  //var memberMax = 2;  var memberMin = 1;
  const { minUser, maxUser } = await Settings.findOne();
  
  //var QtdTimes = usuarios.Count / memberMax;
  const QtdTimes = usuarios.length / maxUser;

  //var lastTeamName = 0;
  let lastTeamName = teams.length;

  //var time = new teams()
  const createdTeams = new Team().save().then(async time => {
    console.log('Criando time...')
    for (let u = 0; u < QtdTimes; u++) {
      console.log(`Entrando no for. ${u}`);
      //name = $"Team {u}"
      time.name = `Team ${u}`;

      //var listUserTime = new List<users>();
      let listUserTime = time.users;

      //var index = 0;
      let index = 0;

      //while (listUserTime.Count != memberMax) {}
      while (listUserTime.length !== maxUser) {
        console.log(`Entrando no while. ${listUserTime.length}`);
        //var actualUser = usuarios[index];
        let actualUser = usuarios[index];
        
        /*var actualUserRole = roles.SingleOrDefault(
            c => c.id.ToString().Equals(usuarios[index].role_id.ToString())
            ).name;*/
        let actualUserRole = await Role.findById(usuarios[index].role_id, { name: 1 });
        
        //var nextUserRole = string.Empty;
        let nextUserRole = {};

        //if (index != usuarios.Count - 1)
        if ( index !== usuarios.length - 1) {
          console.log(`Verificando se o Index(${index} é diferente que user.length-1(${usuarios.length-1}))`);
          /*nextUserRole = roles.SingleOrDefault(
            c => c.id.ToString().Equals(usuarios[index + 1].role_id.ToString())
          ).name;*/
          nextUserRole = await Role.findById(usuarios[index + 1].role_id, { name: 1 });
        } else {
          /*nextUserRole = roles.SingleOrDefault(c => {
            c.id.ToString().Equals(usuarios[index].role_id.ToString())
          }).name;*/
          nextUserRole = await Role.findById(usuarios[index].role_id, { name: 1 });
        }

        if (!actualUserRole.equals(nextUserRole)) {
          //var anteriorUserRole = string.Empty;
          let anteriorUserRole = {};

          if (index != 0) {
            /*anteriorUserRole = roles.SingleOrDefault(c => {
                  c.id.ToString().Equals(usuarios[index - 1].role_id.ToString())
              }).name;*/
            anteriorUserRole = await Role.findById(usuarios[index - 1].role_id, { name: 1 });
          }

          if (!actualUserRole.equals(anteriorUserRole)) {
            actualUser.team_id = time._id;
            listUserTime.push(actualUser._id);
            time.users.push(actualUser._id);
          }

         //else if (index + 1 == usuarios.Count)
        } else if (index + 1 === usuarios.length) {
          //var anteriorUserRole = string.Empty;
          let anteriorUserRole = {};
          if (index !== 0) {
            /*anteriorUserRole = roles.SingleOrDefault(c => {
                  c.id.ToString().Equals(usuarios[index - 1].role_id.ToString())
              }).name;*/
            anteriorUserRole = await Role.findById(usuarios[index - 1].role_id, { name: 1 });
          }

          if (!actualUserRole.equals(anteriorUserRole)) {
            actualUser.team_id = time._id;
            listUserTime.push(actualUser._id);
            time.users.push(actualUser._id);
          }

        }

        index++;
      }

      lastTeamName++;
    }

    /*var usuariosSemTimeResto = usuarioService.Usuarios.Find(new BsonDocument()).ToList()
      .Where(usuario => usuario.team_id == null).ToList();*/
    let usuariosSemTimeResto = await User.find({ team_id: [undefined, null] });

    //var Restantes = usuariosSemTimeResto.Count % memberMax;
    let restantes = usuariosSemTimeResto.length % maxUser;

    //var time = new teams()
    const createdTeams = new Team().save().then(async time => {
      for (let i = 0; i < restantes / minUser; i++) {
        //name = $"Team {u}"
        time.name = `Team ${u}`;

        //var listUserTime = new List<users>();
        let listUserTime = time.users;

        //var index = 0;
        let index = 0;

        //while (listUserTime.Count != memberMax) {}
        while (listUserTime.length !== maxUser) {
          //var actualUser = usuarios[index];
          let actualUser = usuarios[index];
          
          /*var actualUserRole = roles.SingleOrDefault(
              c => c.id.ToString().Equals(usuarios[index].role_id.ToString())
              ).name;*/
          let actualUserRole = await Role.findById(usuarios[index].role_id, { name: 1 });
          
          //var nextUserRole = string.Empty;
          let nextUserRole = {};

          //if (index != usuarios.Count - 1)
          if ( index !== usuarios.length - 1) {
            /*nextUserRole = roles.SingleOrDefault(
              c => c.id.ToString().Equals(usuarios[index + 1].role_id.ToString())
            ).name;*/
            nextUserRole = await Role.findById(usuarios[index + 1].role_id, { name: 1 });
          } else {
            /*nextUserRole = roles.SingleOrDefault(c => {
              c.id.ToString().Equals(usuarios[index].role_id.ToString())
            }).name;*/
            nextUserRole = await Role.findById(usuarios[index].role_id, { name: 1 });
          }

          if (!actualUserRole.equals(nextUserRole)) {
            //var anteriorUserRole = string.Empty;
            let anteriorUserRole = {};

            if (index != 0) {
              /*anteriorUserRole = roles.SingleOrDefault(c => {
                    c.id.ToString().Equals(usuarios[index - 1].role_id.ToString())
                }).name;*/
              anteriorUserRole = await Role.findById(usuarios[index - 1].role_id, { name: 1 });
            }

            if (!actualUserRole.equals(anteriorUserRole)) {
              actualUser.team_id = time._id;
              listUserTime.push(actualUser._id);
            }

          //else if (index + 1 == usuarios.Count)
          } else if (index + 1 === usuarios.length) {
            //var anteriorUserRole = string.Empty;
            let anteriorUserRole = {};
            if (index !== 0) {
              /*anteriorUserRole = roles.SingleOrDefault(c => {
                    c.id.ToString().Equals(usuarios[index - 1].role_id.ToString())
                }).name;*/
              anteriorUserRole = await Role.findById(usuarios[index - 1].role_id, { name: 1 });
            }

            if (!actualUserRole.equals(anteriorUserRole)) {
              actualUser.team_id = time._id;
              listUserTime.push(actualUser._id);
            }

          }

          index++;
        }

        return res.send(time);
      }

      return res.send(time);
    }).catch(err => {
      res.status(400).send({ error: err });
    });
  }).catch(err => {
    err;
  });
  
  return res.send(createdTeams);
});

module.exports = router;
