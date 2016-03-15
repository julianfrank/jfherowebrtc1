function server() {
    'use strict'
    //Key Libraries
    //require('newrelic')
    const expressSession = require('express-session');
    const redisStore = require('connect-redis')(expressSession);

    //Add-on Modules
    const helpers = require('../apps/helpers')

    //Initialization
    const port = process.env.PORT || 80
    const log = helpers.log

    //Redis Initialisation
    let myRedis = require('../apps/redisCode')
    const initRedis = () => myRedis.initRedis()
    const quitRedis = () => myRedis.quitRedis()
    const redisSessionStore = myRedis.redisSessionStore


    //Mongoose Initialisaton
    let mydb = require('../apps/mongooseCode')
    const initMongoose = () => mydb.initMongoose()
    const closeMongoose = () => mydb.closeMongoose()

    //Express Application Initialization
    let myexpress = require('../apps/expressCode')
    const app = myexpress.app
    const initExpress = () => myexpress.initExpress(redisSessionStore, expressSession)

    const startServer = () => {
        log('Going to start Server. Press Control+C to Exit')
        app.listen(port, () => { log(helpers.readPackageJSON(__dirname, "name") + " " + helpers.readPackageJSON(__dirname, "version") + "\tStarted & Listening on port\t: " + port) })
    }

    // Start reading from stdin so we don't exit directly.
    process.stdin.resume();
    process.on('SIGINT', () => { stopProcess('SIGINT') });

    const stopProcess = (reason) => {
        log('About to exit due to ' + reason);
        closeMongoose().then(quitRedis).then(exitProcess).catch(exitProcess)
    }

    const exitProcess = () => process.exit(0)

    //Start the Initiation
    initRedis().then(initMongoose).then(startServer).then(initExpress).catch(stopProcess)
}
module.exports.server = exports.server = server