module.exports = {
  secret: process.env.APP_SECRET, // secredo do token que está no .env
  expiresIn: '1d', // tempo para expirar o token
};