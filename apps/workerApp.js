function workerApp() {
    'use strict'
    //Add-on Modules
    const helpers = require('../apps/helpers')
    const log = helpers.remoteLog
    let logMeta = { js: 'workerApp.js' }
    //const check = helpers.checkLog
    const port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 80

    //Key Libraries
    const express = require('express')
    const app = express()
    const server = require('http').Server(app)
    const io = require('socket.io')(server)

    //Redis Session Store and Express Session Management Module 
    const expressSession = require('express-session');
    const redis = require('redis')
    const redisStore = require('connect-redis')(expressSession);
    //Passport for Authentication Management
    let passport = require('passport')
    //Mongoose for Database
    const mongoose = require('mongoose')
    let mongoConnection = mongoose.connection

    //User Manager Initialization
    const addUserManager = require('../apps/userManager').addUserManager

    //Redis Initialisation
    const initRedis = require('../apps/redisCode').initRedis
    const quitRedis = require('../apps/redisCode').quitRedis
    const initUMRedis = require('../apps/redisCode').initUMRedisClient
    const quitUMRedis = require('../apps/redisCode').quitUMRedis
    const initSIOPubRedis = require('../apps/redisCode').initSIOPubRedisClient
    const quitSIOPubRedis = require('../apps/redisCode').quitSIOPubRedis
    const initSIOSubRedis = require('../apps/redisCode').initSIOSubRedisClient
    const quitSIOSubRedis = require('../apps/redisCode').quitSIOSubRedis

    //Socket.io Initialisation
    const initSocket = require('../apps/socketioCode.js').addSocketIOServices

    //Express Application Initialization 
    const initExpress = require('../apps/expressCode').initExpress
    const addAzAd = require('../apps/expressAzAd').addAzAd
    const addAzAdRoutes = require('../apps/expressAzAdRoutes').addAzAdRoutes
    const addAppRoutes = require('../apps/expressStdAppRoutes').addAppRoutes
    const addSignalRoutes = require('../apps/signallingRoutes').addSignalRoutes
    const addLastRoute = require('../apps/expressLastRoute').addLastRoute

    //Mongoose Initialisaton
    const initMongoose = require('../apps/mongooseCode').initMongoose
    const closeMongoose = require('../apps/mongooseCode').closeMongoose

    //Twilio Initialisaton
    const initTwilio = require('../apps/twilioCode').initTwilio
    const closeTwilio = require('../apps/twilioCode').closeTwilio

    //Bandwidth Initialisaton
    const initBandwidth = require('../apps/bandwidthCode').initBandwidth
    const closeBandwidth = require('../apps/bandwidthCode').closeBandwidth

    //Start Server
    const startServer = () => {
        log('info', 'Going to start ' + app.locals.name + '. Press Control+C to Exit', logMeta)

        server.listen(port, process.env.OPENSHIFT_NODEJS_IP, () => {
            log('info', app.locals.name + " " +
                helpers.readPackageJSON(__dirname, "version") +
                " Started & Listening on port: " + port, logMeta)
        })
    }

    //Stop PRocess
    const stopProcess = (reason) => {
        log('warn', 'About to exit due to ' + reason, logMeta)
        closeMongoose(thisProcessObjects)
            .then(closeBandwidth)
            .then(closeTwilio)
            .then(quitRedis)
            .then(quitUMRedis)
            .then(quitSIOPubRedis)
            .then(quitSIOSubRedis)
            .then(exitProcess)
            .catch(exitProcess)
    }
    // Process Shutdown Zone
    const exitProcess = () => {
        if (process.connected) {
            log('warn', 'About to Disconnect this Process', logMeta)
            process.disconnect()
        } else {
            log('warn', 'About to Exit Process', logMeta)
            process.exit(0)
        }
    }
    process.stdin.resume()
    process.on('SIGINT', () => { stopProcess('SIGINT') });

    //Object Packaged to be passed between Boot Loader and Unloaders
    const thisProcessObjects = {//[TODO]To be cleaned up with only variables initialised in workerApp to be placed here
        server: server, port: port, io: io,
        express: express, app: app, expressSession: expressSession, passport: passport,
        redis: redis, redisStore: redisStore,
        mongoose: mongoose, mongoConnection: mongoConnection,
        stopProcess: stopProcess
    }

    //Start the Application
    initMongoose(thisProcessObjects)
        .then(initRedis)
        .then(initUMRedis)
        .then(initSIOPubRedis)
        .then(initSIOSubRedis)
        .then(addUserManager)
        .then(initSocket)
        .then(initExpress)
        .then(addAzAd)
        .then(addAzAdRoutes)
        .then(addSignalRoutes)
        .then(addAppRoutes)
        .then(initBandwidth)
        .then(initTwilio)
        .then(addLastRoute)
        .then(startServer)
        .catch(stopProcess)

}
module.exports = { workerApp }