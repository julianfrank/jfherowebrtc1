'use strict'

//Key Libraries
//require('newrelic')
var express = require('express')
//var bodyParser = require('body-parser') //Required to read the body
//var session = require('express-session') //Required to handle sessions
//var cookieparser = require('cookie-parser') //Sesisons inturn need cookie parsing
//var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose')
//Add-on Modules
var helpers = require('./mylibs/helpers')

//Initialization
var port = process.env.PORT || 80
var mongoLabURL = process.env.mongoLabURL || require('./secrets.js').mongoDBConnectionString.toString()
mongoose.connect(mongoLabURL, () => console.info('Connected to ' + mongoLabURL))
let mongoConnection = mongoose.connection
var log = helpers.log

//Express Application Initialization
var app = express()
app.engine('html', helpers.readHTML);// define the template engine [(filePath, options, callback)]
app.set('views', __dirname + '/pages/'); // specify the views directory
app.set('view engine', 'html'); // register the template engine
//app.use(cookieparser());
//app.use(session({ secret: helpers.hourlyState(), resave: true, saveUninitialized: true, cookie: { path: '/', httpOnly: true, secure: false, maxAge: 600000 } })); //maxAge setto 10 mins
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: true }));
app.use('/static', express.static('static'));

app.all('*', function(req, res, next) {
    console.info('ips:' + req.ips + '\tprotocol:' + req.protocol + '\txhr:' + req.xhr)
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