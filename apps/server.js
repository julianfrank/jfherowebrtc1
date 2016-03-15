function server() {
    'use strict'
    //Key Libraries
    //require('newrelic')

    const redis = require("redis")
    const expressSession = require('express-session');

    //Add-on Modules
    const helpers = require('../apps/helpers')

    //Initialization
    const port = process.env.PORT || 80
    const log = helpers.log

    const redisLabURL = process.env.redisLabURL || require('../secrets.js').redisConnectionString.toString()
    const redisLabPASS = process.env.redisLabPASS || require('../secrets.js').redisPassword.toString()
    let redisClient = null
    let redisSessionStore = null

    //Redis Initialisation
    const initRedis = () => require('../apps/redis').initRedis(redis, log, redisClient, redisSessionStore, redisStore, redisLabURL, redisLabPASS)
    const quitRedis = () => require('../apps/redis').quitRedis(redis, log, redisLabURL, redisClient)


    //Mongoose Initialisaton
    let mydb = require('../apps/mongooseCode')
    const initMongoose = () => mydb.initMongoose()
    const closeMongoose = () => mydb.closeMongoose()

    //Express Application Initialization
    let myexpress = require('../apps/expressCode')
    const app = myexpress.app
    const redisStore = require('connect-redis')(expressSession);
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