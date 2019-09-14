if (process.env.NODE_ENV == 'production') {
    // banco de produção
    module.exports = {
        mongoURI: 'mongodb://valdjr:asdf000@ds051615.mlab.com:51615/vjr-teamorganizer'
    }
} else {
    // banco local
    module.exports = {
        mongoURI: 'mongodb://valdjr:asdf000@ds051615.mlab.com:51615/vjr-teamorganizer'
    }
}