function server() {
    'use strict'
    //Key Libraries
    //require('newrelic')
    const express = require('express')
    const session = require('express-session');
    //var bodyParser = require('body-parser') //Required to read the body
    const mongoose = require('mongoose')
    const redis = require("redis")
    const redisStore = require('connect-redis')(session);

    //Add-on Modules
    const helpers = require('../apps/helpers')

    //Initialization
    const port = process.env.PORT || 80
    const log = helpers.log

    //Redis Initialisation
    const redisLabURL = process.env.redisLabURL || require('../secrets.js').redisConnectionString.toString()
    const redisLabPASS = process.env.redisLabPASS || require('../secrets.js').redisPassword.toString()
    const redisRetryStrategy = (options) => {
        log('Redis Retry being Executed')
        if (options.error.code === 'ECONNREFUSED') { return new Error('The RedisLab server refused the connection'); }// End reconnecting on a specific error and flush all commands with a individual error
        if (options.total_retry_time > 1000 * 60 * 60) { return new Error('RedisLab Retry time exhausted'); }// End reconnecting after a specific timeout and flush all commands with a individual error
        if (options.times_connected > 10) { return undefined; }// End reconnecting with built in error
        return Math.max(options.attempt * 100, 3000);// reconnect after
    }
    let redisClient = null, redisSessionStore = null
    //const initRedis = () => {
    const initRedis = () => {
        return new Promise((resolve, reject) => {
            redisClient = redis.createClient({ url: redisLabURL, retry_strategy: redisRetryStrategy })
            redisClient.auth(redisLabPASS, () => {
                redisClient.info((err, reply) => {
                    if (err) {
                        log('Error Returned by Redis Server :' + err)
                        reject()
                    } else {
                        log('Connected to ' + redisLabURL)
                        redisSessionStore = new redisStore({ url: redisLabURL, client: redisClient, ttl: 360, prefix: 'session.' })// create new redis store for Session Management
                        redisSessionStore.client.info((err, reply) => {
                            if (err) {
                                log('Error Returned by Redis Server :' + err)
                                reject()
                            } else {
                                log('Redis Session Store Created Successfully')
                                resolve()//Ensure we proceed only if Redis is connected and RedisSessionstore is working
                            }
                        })
                    }
                })
            })
        })
    }
    const quitRedis = (next) => {
        return new Promise((resolve, reject) => {
            redisClient.quit((err, res) => {
                if (res === 'OK') {
                    log('Closed Redis Connection: ' + redisLabURL)
                    redisSessionStore.client.quit((err, res) => {
                        if (res === 'OK') log('Alert! Redis Session Still seems Not Closed. Continuing to End Process Anyway')
                        resolve()
                    })
                } else {
                    log('Error: Redis Connection not Closed. Redis Server Says\tResult:' + res + '\tError:' + err + ' Continuing to End Process Anyway')
                    reject()
                }
            })
        })
    }

    //Mongoose Initialisaton
    const mongoLabURL = process.env.mongoLabURL || require('../secrets.js').mongoDBConnectionString.toString()
    let mongoConnection = null
    const initMongoose = () => {
        return new Promise((resolve, reject) => {
            mongoose.connect(mongoLabURL, () => {
                log('Connected to ' + mongoLabURL)
                mongoConnection = mongoose.connection
                //Start the server only if DB is Ready
                mongoConnection.once('open', (err, db) => {
                    if (err) {
                        log('Problem Connecting with ' + mongoLabURL + 'due to ' + err + ' Going to exit')
                        reject()
                    } else {
                        resolve()
                    }
                })
            })
        })
    }
    const closeMongoose = (next) => {
        return new Promise((resolve, reject) => {
            mongoConnection.close(() => {//Centralising Process exit so that DB/Session is closed before exit...
                log('Closed Mongoose Connection : ' + mongoLabURL)
                resolve()
            })
        })
    }

    //Express Application Initialization
    const app = express()
    const initExpress = () => {
        return new Promise((resolve, reject) => {
            app.engine('html', helpers.readHTML);// define the template engine [(filePath, options, callback)]
            app.set('views', 'pages'); // specify the views directory
            app.set('view engine', 'html'); // register the template engine
            app.set('trust proxy', 1) // trust first proxy
            app.use(session({
                store: redisSessionStore,
                secret: helpers.hourlyState(), saveUninitialized: false, resave: false
            }));
            //app.use(bodyParser.json());
            //app.use(bodyParser.urlencoded({ extended: true }));
            app.use('/static', express.static('static'));

            //Express Routers
            app.all('*', (req, res, next) => {
                log('ips:' + req.ips + '\tprotocol:' + req.protocol + '\txhr:' + req.xhr + '\treq.session:' + !!req.session)
                if (typeof req.session === 'undefined') {
                    console.trace()
                    exitProcess(0, 'Fatal Error: Session Service Failed. Possible Redis Failure. Going to exit Process.')
                }
                return next()
            })

            app.all('/*.html', (req, res) => {// Need this to load test using loader.io
                res.contentType('text/html')
                res.render(req.params[0])
            })

            app.all('/favicon.ico', (req, res) => {// Show my Pretty Face ;) on the favicon area
                res.contentType('image/x-icon')
                res.redirect('/static/favicon.ico')
            })

            app.all('/', (req, res) => {// Main page
                if (!req.session.lastpath) {
                    req.session.lastpath = req.hostname + req.originalUrl + req.path
                    log('No lastpath in session. Setting ' + req.session.lastpath)
                }
                res.contentType('text/html')
                res.render('jfmain')
            })

            resolve()
        })
    }



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