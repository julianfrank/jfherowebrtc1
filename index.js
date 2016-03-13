'use strict'

//Key Libraries
//require('newrelic')
var express = require('express')
//var bodyParser = require('body-parser') //Required to read the body
//var session = require('express-session') //Required to handle sessions
//var cookieparser = require('cookie-parser') //Sesisons inturn need cookie parsing
//var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose')
var redis = require("redis")
var session = require('express-session');
var redisStore = require('connect-redis')(session);
//Add-on Modules
var helpers = require('./mylibs/helpers')

//Initialization
var port = process.env.PORT || 80
var mongoLabURL = process.env.mongoLabURL || require('./secrets.js').mongoDBConnectionString.toString()
var redisLabURL = process.env.redisLabURL || require('./secrets.js').redisConnectionString.toString()
var redisLabPASS = process.env.redisLabPASS || require('./secrets.js').redisPassword.toString()
mongoose.connect(mongoLabURL, () => console.info('Connected to ' + mongoLabURL))
let mongoConnection = mongoose.connection
let redisClient = redis.createClient({
    url: redisLabURL,
    retry_strategy: function(options) {
        if (options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with a individual error
            return new Error('The RedisLab server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands with a individual error
            return new Error('RedisLab Retry time exhausted');
        }
        if (options.times_connected > 10) {
            // End reconnecting with built in error
            return undefined;
        }
        // reconnect after
        return Math.max(options.attempt * 100, 3000);
    }
})
redisClient.auth(redisLabPASS, (x) => 'RedisLab Connected on ' + redisLabURL + x)

var log = helpers.log

//Express Application Initialization
var app = express()
app.engine('html', helpers.readHTML);// define the template engine [(filePath, options, callback)]
app.set('views', __dirname + '/pages/'); // specify the views directory
app.set('view engine', 'html'); // register the template engine
app.use(session({
    secret: helpers.hourlyState(),
    // create new redis store.
    store: new redisStore({ /*url: redisLabURL, */client: redisClient, ttl: 260 }),
    saveUninitialized: false,
    resave: true,
    cookie: { path: '/', httpOnly: false, secure: true, maxAge: 600000 }
}));

//app.use(cookieparser());
//app.use(session({ secret: helpers.hourlyState(), resave: true, saveUninitialized: true, cookie: { path: '/', httpOnly: true, secure: false, maxAge: 600000 } })); //maxAge setto 10 mins
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: true }));
app.use('/static', express.static('static'));

app.all('*', function(req, res, next) {
    console.info('ips:' + req.ips + '\tprotocol:' + req.protocol + '\txhr:' + req.xhr + '\tsession:' + JSON.stringify(req.session))
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
    req.session.lastpath = req.hostname + req.originalUrl + req.path
    res.contentType('text/html')
    res.render('jfmain')
})

mongoConnection.once('open', (err, db) => {
    if (err) {
        console.log('Problem Connecting with ' + mongoLabURL + ' Going to exit')
        process.exit(1)
    } else {
        console.info('Going to start Server. Press Control+C to Exit')



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
    console.log('About to exit');
    mongoConnection.close(() => {
        console.log('Closed Mongoose Connection : ', mongoLabURL)
        process.exit(1)
    })
});