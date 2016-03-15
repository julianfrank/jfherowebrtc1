'use strict'

const express = require('express')
//var bodyParser = require('body-parser') //Required to read the body
const helpers = require('../apps/helpers')

const log = helpers.log

const app = express()

let initExpress = (redisSessionStore, expressSession) => {
    return new Promise((resolve, reject) => {
        app.engine('html', helpers.readHTML);// define the template engine [(filePath, options, callback)]
        app.set('views', 'pages'); // specify the views directory
        app.set('view engine', 'html'); // register the template engine
        app.set('trust proxy', 1) // trust first proxy
        app.use(expressSession({
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
module.exports = { app, initExpress }