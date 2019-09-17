require('dotenv/config');

if (process.env.NODE_ENV == 'production') {
    // banco de produção
    module.exports = {
        mongoURI: process.env.MONGO_PROD
    }
} else if (process.env.NODE_ENV == 'development') {
    // banco de desenvolvimento
    module.exports = {
        mongoURI: process.env.MONGO_DEV
    }
} else {
    // banco local
    module.exports = {
        mongoURI: process.env.MONGO_LOCAL
    }
}