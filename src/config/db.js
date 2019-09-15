if (process.env.NODE_ENV == 'production') {
    // banco de produção
    module.exports = {
        mongoURI: 'mongodb://openhackDev:hackthon1937@ec2-54-207-50-196.sa-east-1.compute.amazonaws.com:27017/OpenHack_Production?connectTimeoutMS=10000&authSource=admin&authMechanism=SCRAM-SHA-256'
    }
} else {
    // banco local
    module.exports = {
        mongoURI: 'mongodb://openhackDev:hackthon1937@ec2-54-207-50-196.sa-east-1.compute.amazonaws.com:27017/OpenHack_Dev?connectTimeoutMS=10000&authSource=admin&authMechanism=SCRAM-SHA-256'
    }
}