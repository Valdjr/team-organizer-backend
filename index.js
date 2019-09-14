const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const db = require('./config/db');

const user = require('./routes/user');
const team = require('./routes/team');

//body-parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

mongoose
mongoose.Promise = global.Promise;
mongoose.connect(db.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conectado com sucesso no mongoDB');
}).catch(err => {
    console.log('Erro ao conectar no mongoDB: ' + err);
});

//public
app.use(express.static(path.join(__dirname, 'public')));

//routes
app.use('/user', user);
app.use('/team', team);

//server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('Servidor rodando');
})