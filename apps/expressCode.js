'use strict'

const express = require('express')
const bodyParser = require('body-parser') //Required to read the body
const cookieParser = require('cookie-parser')
let passport = require('passport')
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const helpers = require('../apps/helpers')

const log = helpers.log

// array to hold logged in users
let users = [];

const app = express()
app.locals.name = 'Julian Frank\'s WebRTC Application'

let initExpress = (redisSessionStore, expressSession) => {
    return new Promise((resolve, reject) => {

        passport.serializeUser(function(user, done) {
            done(null, user.email);
        });

        passport.deserializeUser(function(id, done) {
            findByEmail(id, function(err, user) {
                done(err, user);
            });
        });

        var findByEmail = function(email, fn) {
            for (var i = 0, len = users.length; i < len; i++) {
                var user = users[i];
                log('we are using user: ', user);
                if (user.email === email) {
                    return fn(null, user);
                }
            }
            return fn(null, null);
        };
        // Use the OIDCStrategy within Passport. (Section 2)  
        //   Strategies in passport require a `validate` function, which accept
        //   credentials (in this case, an OpenID identifier), and invoke a callback
        //   with a user object.
        passport.use(new OIDCStrategy({
            callbackURL: process.env.RETURNURL || require('../secrets.js').returnURL,
            //realm: process.env.REALM || require('../secrets.js').realm,
            clientID: process.env.CLIENTID || require('../secrets.js').clientID,
            clientSecret: process.env.CLIENTSECRET || require('../secrets.js').clientSecret,
            //oidcIssuer: process.env.ISSUER || require('../secrets.js').issuer,
            identityMetadata: process.env.IDENMETA || require('../secrets.js').identityMetadata,
            skipUserProfile: true,
            responseType: process.env.RESPTYPE || require('../secrets.js').responseType,
            responseMode: process.env.RESPMODE || require('../secrets.js').responseMode,
            validateIssuer: true,
            passReqToCallback: false,
            loggingLevel: 'warn' // valid are 'info', 'warn', 'error'. Error always goes to stderr in Unix.
        },
            function(iss, sub, profile, accessToken, refreshToken, done) {
                if (!profile.email) {
                    return done(new Error("No email found"), null);
                }
                // asynchronous verification, for effect...
                process.nextTick(function() {
                    findByEmail(profile.email, function(err, user) {
                        if (err) {
                            return done(err);
                        }
                        if (!user) {
                            // "Auto-registration"
                            users.push(profile);
                            return done(null, profile);
                        }
                        return done(null, user);
                    });
                });
            }
        ));

        app.engine('html', helpers.readHTML);// define the template engine [(filePath, options, callback)]
        app.set('views', 'pages'); // specify the views directory
        app.set('view engine', 'html'); // register the template engine
        app.set('trust proxy', 1) // trust first proxy
        app.use(cookieParser())
        app.use(expressSession({
            store: redisSessionStore,
            secret: helpers.hourlyState(), saveUninitialized: false, resave: false
        }));
        app.use(bodyParser.json({ type: 'application/*+json' }));
        app.use(bodyParser.text({ type: 'text/html' }))
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(bodyParser.raw({ type: 'application/vnd.custom-type' }))
        app.use('/static', express.static('static'));
        // Initialize Passport!  Also use passport.session() middleware, to support
        // persistent login sessions (recommended).
        app.use(passport.initialize());
        app.use(passport.session());

        app.use(function(err, req, res, next) { if (!err) reject('Problem in Express with error :' + err) });

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

        app.get('/oauth2signin',
            passport.authenticate('azuread-openidconnect', { failureRedirect: '/login' }),
            function(req, res) {
                log('Login was called in the Sample');
                res.redirect('/');
            });

        // GET /auth/openid
        //   Use passport.authenticate() as route middleware to authenticate the
        //   request.  The first step in OpenID authentication will involve redirecting
        //   the user to their OpenID provider.  After authenticating, the OpenID
        //   provider will redirect the user back to this application at
        //   /auth/openid/return
        app.get('/auth/openid',
            passport.authenticate('azuread-openidconnect', { failureRedirect: '/oauth2signin' }),
            function(req, res) {
                log('Authenitcation was called in the Sample');
                res.redirect('/');
            })

        // GET /oauth2return
        //   Use passport.authenticate() as route middleware to authenticate the
        //   request.  If authentication fails, the user will be redirected back to the
        //   login page.  Otherwise, the primary route function function will be called,
        //   which, in this example, will redirect the user to the home page.
        app.get('/oauth2return',
            passport.authenticate('azuread-openidconnect', { failureRedirect: '/oauth2signin' }),
            function(req, res) {
                log('We received a GET return from AzureAD.');
                res.render('secureapp');
            });

        // POST /oauth2return
        //   Use passport.authenticate() as route middleware to authenticate the
        //   request.  If authentication fails, the user will be redirected back to the
        //   login page.  Otherwise, the primary route function function will be called,
        //   which, in this example, will redirect the user to the home page.
        app.post('/oauth2return',
            passport.authenticate('azuread-openidconnect', { failureRedirect: '/oauth2signin' }),
            function(req, res) {
                log.info('We received a POST return from AzureAD.');
                res.render('secureapp');
            });

        app.get('/logout', function(req, res) {
            req.logout();
            res.redirect('/');
        });

        //Express Routers
        app.all('*', (err, req, res, next) => {
            log(req.locals.name + '\tips:' + req.ips + '\tprotocol:' + req.protocol + '\txhr:' + req.xhr + '\treq.session:' + !!req.session)
            if (typeof req.session === 'undefined') reject('Fatal Error: Session Service Failed. Possible Redis Failure. Going to exit Process.')
            if (err) reject('Fatal Error: Error in Express Route ${err}. Going to exit Process.')
            return next()
        })

        // Simple route middleware to ensure user is authenticated. (Section 4)
        //   Use this route middleware on any resource that needs to be protected.  If
        //   the request is authenticated (typically via a persistent login session),
        //   the request will proceed.  Otherwise, the user will be redirected to the
        //   login page.
        function ensureAuthenticated(req, res, next) {
            if (req.isAuthenticated()) { return next(); }
            res.redirect('/login')
        }

        process.nextTick(() => resolve())
    })
}
module.exports = { app, initExpress }