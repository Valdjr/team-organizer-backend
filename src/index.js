const express = require("express");
const app = express();
app.disable("x-powered-by");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const db = require("./config/db");

const settings = require("./routes/settings");
const team = require("./routes/team");
const roles = require("./routes/roles");
const skill = require("./routes/skill");
const users = require("./routes/users");

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

//body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

mongoose.Promise = global.Promise;
mongoose
  .connect(db.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then(() => {
    console.log(`Conectado com sucesso no mongoDB`);
  })
  .catch(err => {
    console.log("Erro ao conectar no mongoDB: " + err);
  });

//public
app.use(express.static(path.join(__dirname, "public")));

//routes
app.use("/settings", settings);
app.use("/team", team);
app.use("/roles", roles);
app.use("/skill", skill);
app.use("/users", users);

//server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor '${process.env.NODE_ENV}' rodando na porta ${PORT}`);
});
