'use strict'
const utils = require('util')
const helpers = require('../apps/helpers')
const log = helpers.log

let initExpress = (processObjects) => {
    log('expressCode.js\t:Initializing Express')
    return new Promise((resolve, reject) => {

        const bodyParser = require('body-parser') //Required to read the body
        const cookieParser = require('cookie-parser')

        let app = processObjects.app
        app.locals.name = 'Julian Frank\'s WebRTC Application'

        app.engine('html', helpers.readHTML);// define the template engine [(filePath, options, callback)]
        app.set('views', 'pages'); // specify the views directory
        app.set('view engine', 'html'); // register the template engine
        app.set('trust proxy', 1) // trust first proxy
        app.use(cookieParser())
        app.use(processObjects.expressSession({
            store: processObjects.redisSessionStore,
            secret: helpers.hourlyState(), saveUninitialized: false, resave: false
        }));
        app.use(bodyParser.json({ type: 'application/*+json' }));
        app.use(bodyParser.text({ type: 'text/html' }))
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(bodyParser.raw({ type: '*/*' }))
        app.use('/static', processObjects.express.static('static'));
        //[TODO] Add logic to detect session store initialization
        //if (!req.session) {                reject('Problem in Express. Session Engine not Initialized')            } 
        app.all('*', (err, req, res, next) => { if (err) reject('expressCode.js\t:Fatal Error: Error in Express Route ${err}. Going to exit Process.') })//Default Route to log All Access..Enters only if there is an error
        app.all('*', (req, res, next) => {//Default Route to log All Access
            log('expressCode.js\t:req.path:' + req.path + '\treq.session:' + !!req.session)
            if (typeof req.session === 'undefined') reject('expressCode.js\t:Fatal Error: Session Service Failed. Possible Redis Failure. Going to exit Process.')
            //res.send(app.locals.name+' : This is Visit Number '+req.session.visitcount++)//Only for debugging ..remove 
            return next()
        })
        process.nextTick(() => {
            //log(utils.inspect(processObjects.redisSessionStore))
            resolve(processObjects)
        })
    })
}

module.exports = { initExpress }