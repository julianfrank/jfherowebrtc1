function server() {
    'use strict'
    //Add-on Modules
    const helpers = require('../apps/helpers')
    const port = process.env.PORT || 80
    const log = helpers.log
    //Key Libraries
    require('newrelic')
    const express = require('express')
    const app = express()
    //Redis Session Store and Express Session Management Module 
    const expressSession = require('express-session');
    const redis = require('redis')
    const redisStore = require('connect-redis')(expressSession);
    //Passport for Authentication Management
    let passport = require('passport')
    //Mongoose for Database
    const mongoose = require('mongoose')
    let mongoConnection = mongoose.connection
    // array to hold logged in users
    //let users = [], redisClient = { redisClient: 'Yet to be Initialized' }, redisSessionStore = { redisSessionStore: 'Yet to be Initialized' }

    //Redis Initialisation
    const initRedis = require('../apps/redisCode').initRedis
    const quitRedis = require('../apps/redisCode').quitRedis

    //Express Application Initialization
    //let myexpress = 
    const initExpress = require('../apps/expressCode').initExpress
    const addAzAd = require('../apps/expressAzAd').addAzAd
    const addAzAdRoutes = require('../apps/expressAzAdRoutes').addAzAdRoutes
    const addAppRoutes = require('../apps/expressStdAppRoutes').addAppRoutes
    const addSignalRoutes = require('../apps/signallingRoutes').addSignalRoutes

    //Mongoose Initialisaton
    const initMongoose = require('../apps/mongooseCode').initMongoose
    const closeMongoose = require('../apps/mongooseCode').closeMongoose

    //Start Server
    const startServer = () => {
        log('server.js: Going to start ' + app.locals.name + '. Press Control+C to Exit')
        app.listen(port, () => { log('server.js: ' + app.locals.name + " " + 
        helpers.readPackageJSON(__dirname, "version") + 
        " Started & Listening on port: " + port) })
    }

    //Stop PRocess
    const stopProcess = (reason) => {
        log('server.js\t:About to exit due to ' + reason);
        closeMongoose(thisProcessObjects)
            .then(quitRedis)
            .then(exitProcess)
            .catch(exitProcess)
    }
    // Process Shutdown Zone
    const exitProcess = () => process.exit(0)
    process.stdin.resume();
    process.on('SIGINT', () => { stopProcess('SIGINT') });

    //Object Packaged to be passed between Boot Loader and Unloaders
    const thisProcessObjects = {
        express: express,app: app,expressSession: expressSession,
        redis: redis,redisStore: redisStore,
        passport: passport,
        mongoose: mongoose,mongoConnection: mongoConnection,
        stopProcess: stopProcess
    }

    //Start the Application
    initRedis(thisProcessObjects)
        .then(initExpress)
        .then(addAzAd)
        .then(addAzAdRoutes)
        .then(addAppRoutes)
        .then(addSignalRoutes)
        .then(initMongoose)
        .then(startServer)
        .catch(stopProcess)

}
module.exports.server = exports.server = server