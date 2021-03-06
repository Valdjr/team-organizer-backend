const express = require("express");
const app = express();
app.disable("x-powered-by");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const db = require("./config/db");
const https = require("https");
const fs = require("fs");
const settings = require("./routes/settings");
const team = require("./routes/team");
const roles = require("./routes/roles");
const skill = require("./routes/skill");
const users = require("./routes/users");
const sort = require("./routes/sort");
const criarUsers = require("./routes/criarUsers");

const options = {
  key: fs.readFileSync(path.resolve(__dirname, "cert.key")),
  cert: fs.readFileSync(path.resolve(__dirname, "cert.pem"))
};

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
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
    useFindAndModify: false,
    useCreateIndex: true
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
app.use("/sort", sort);
app.use("/criarUsers", criarUsers);

//server
const PORT = process.env.PORT || 5000;
const SSLPORT = process.env.SSLPORT || 5001;
https.createServer(options, app).listen(SSLPORT, () => {
  console.log(
    `Servidor '${process.env.NODE_ENV}' rodando em SSL na porta ${SSLPORT}`
  );
});
app.listen(PORT, () => {
  console.log(`Servidor '${process.env.NODE_ENV}' rodando na porta ${PORT}`);
});
