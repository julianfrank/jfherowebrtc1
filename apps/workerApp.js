function workerApp() {
    'use strict'
    //Add-on Modules
    const helpers = require('../apps/helpers')
    const port = process.env.PORT || 80
    const log = helpers.log
    //Key Libraries
    require('newrelic')
    //const server = require('http').createServer()
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
    // array to hold logged in users

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
    const initSocket =require('../apps/socketioCode.js').addSocketIOServices

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

    //Start Server
    const startServer = () => {
        log('workerApp.js\t: Going to start ' + app.locals.name + '. Press Control+C to Exit')

        server.listen(port, () => {
            log('workerApp.js\t: ' + app.locals.name + " " +
                helpers.readPackageJSON(__dirname, "version") +
                " Started & Listening on port: " + port)
        })
    }

    //Stop PRocess
    const stopProcess = (reason) => {
        log('workerApp.js\t:About to exit due to ' + reason)
        closeMongoose(thisProcessObjects)
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
            log('workerApp.js\t:About to Disconnect this Process')
            process.disconnect()
        } else {
            log('workerApp.js\t:About to Exit Process')
            process.exit(0)
        }
    }
    process.stdin.resume()
    process.on('SIGINT', () => { stopProcess('SIGINT') });

    //Object Packaged to be passed between Boot Loader and Unloaders
    const thisProcessObjects = {
        server: server, port: port, io: io,
        express: express, app: app, expressSession: expressSession, passport: passport,
        redis: redis, redisStore: redisStore,
        mongoose: mongoose, mongoConnection: mongoConnection,
        stopProcess: stopProcess
    }

    //Start the Application
    initRedis(thisProcessObjects)
        .then(initUMRedis)
        .then(addUserManager)
        .then(initSIOPubRedis)
        .then(initSIOSubRedis)
        .then(initSocket)
        .then(initExpress)
        .then(addAzAd)
        .then(addAzAdRoutes)
        .then(addSignalRoutes)
        //.then(initMongoose)
        .then(addAppRoutes)
        .then(addLastRoute)
        .then(startServer)
        .catch(stopProcess)

}
module.exports = { workerApp }