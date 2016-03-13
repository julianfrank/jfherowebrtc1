'use strict'

//Key Libraries
//require('newrelic')
const express = require('express')
const session = require('express-session');
//var bodyParser = require('body-parser') //Required to read the body
var mongoose = require('mongoose')
var redis = require("redis")
var redisStore = require('connect-redis')(session);

//Add-on Modules
var helpers = require('./mylibs/helpers')

//Initialization
var port = process.env.PORT || 80
var mongoLabURL = process.env.mongoLabURL || require('./secrets.js').mongoDBConnectionString.toString()
var redisLabURL = process.env.redisLabURL || require('./secrets.js').redisConnectionString.toString()
var redisLabPASS = process.env.redisLabPASS || require('./secrets.js').redisPassword.toString()
var redisRetryStrategy = (options) => {
    if (options.error.code === 'ECONNREFUSED') { return new Error('The RedisLab server refused the connection'); }// End reconnecting on a specific error and flush all commands with a individual error
    if (options.total_retry_time > 1000 * 60 * 60) { return new Error('RedisLab Retry time exhausted'); }// End reconnecting after a specific timeout and flush all commands with a individual error
    if (options.times_connected > 10) { return undefined; }// End reconnecting with built in error
    return Math.max(options.attempt * 100, 3000);// reconnect after
}

mongoose.connect(mongoLabURL, () => log('Connected to ' + mongoLabURL))
let mongoConnection = mongoose.connection
let redisClient = redis.createClient({ url: redisLabURL, retry_strategy: redisRetryStrategy })
redisClient.auth(redisLabPASS)

var log = helpers.log

//Express Application Initialization
var app = express()
app.engine('html', helpers.readHTML);// define the template engine [(filePath, options, callback)]
app.set('views', __dirname + '/pages/'); // specify the views directory
app.set('view engine', 'html'); // register the template engine
app.set('trust proxy', 1) // trust first proxy
app.use(session({
    store: new redisStore({ url: redisLabURL, client: redisClient, ttl: 260, prefix: 'session.' }),// create new redis store.
    secret: helpers.hourlyState(), saveUninitialized: false, resave: false
}));

//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: true }));
app.use('/static', express.static('static'));

app.all('*', function(req, res, next) {
    log('ips:' + req.ips + '\tprotocol:' + req.protocol + '\txhr:' + req.xhr + '\tsession:' + JSON.stringify(req.session.lastpath))
    return next()
})

app.all('/*.html', function(req, res) {// Need this to load test using loader.io
    res.contentType('text/html')
    res.render(req.params[0])
})

app.all('/favicon.ico', function(req, res) {// Show my Pretty Face ;) on the favicon area
    res.contentType('image/x-icon')
    res.redirect('/static/favicon.ico')
})

app.all('/', function(req, res) {// Main page
    if (!req.session.lastpath) {
        req.session.lastpath = req.hostname + req.originalUrl + req.path
        log(req.session.lastpath)
    }
    res.contentType('text/html')
    res.render('jfmain')
})

//Start the server only if DB is Ready
mongoConnection.once('open', (err, db) => {
    if (err) {
        log('Problem Connecting with ' + mongoLabURL + ' Going to exit')
        process.exit(1)
    } else {
        log('Going to start Server. Press Control+C to Exit')
        app.listen(port, function() {
            log(helpers.readPackageJSON(__dirname, "name") + " " +
                helpers.readPackageJSON(__dirname, "version") +
                "\tStarted & Listening on port\t: " + port)
        })
    }
})

// Start reading from stdin so we don't exit directly.
process.stdin.resume();
process.on('SIGINT', () => {
    log('About to exit');
    mongoConnection.close(() => {
        log('Closed Mongoose Connection : ' + mongoLabURL)
        process.exit(1)
    })
});