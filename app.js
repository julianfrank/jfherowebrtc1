'use strict'

//Key Libraries
var express = require('express')
var bodyParser = require('body-parser') //Required to read the body
var session = require('express-session') //Required to handle sessions
var cookieparser = require('cookie-parser') //Sesisons inturn need cookie parsing

//Add-on Modules
var helpers = require('./helpers')

//Initialization
var port = process.env.PORT || 4000
 
//Express Application Initialization
var app = express()
app.engine('html', helpers.readHTML);// define the template engine [(filePath, options, callback)]
app.set('views', __dirname + '/pages/'); // specify the views directory
app.set('view engine', 'html'); // register the template engine
app.use(cookieparser());
app.use(session({ secret: helpers.hourlyState(), resave: true, saveUninitialized: true, cookie: { path: '/', httpOnly: true, secure: false, maxAge: 600000 } })); //maxAge setto 10 mins
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/public', express.static('public'));
app.use('/js', express.static('js'));
app.use('/css', express.static('css'));

app.all('*', function (req, res) {
    res.contentType('text/html')
    res.render('try1')
})

app.listen(port, function () {
    console.log(helpers.readPackageJSON("name") + " " +
        helpers.readPackageJSON("version") +
        " Started & Listening on port:", port +
        '\nAvailable Network Interfaces:', helpers.getHostNetworkInterfaces())
});
