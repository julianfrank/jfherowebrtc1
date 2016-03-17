'use strict'

let passport = require('passport')
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const helpers = require('../apps/helpers')
const log = helpers.log

// array to hold logged in users
let users = [];
let newapp = {}

let initPassport = (app) => {
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

        // Initialize Passport!  Also use passport.session() middleware, to support
        // persistent login sessions (recommended).
        app.use(passport.initialize());
        app.use(passport.session());

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
                res.redirect('/');
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
                res.redirect('/');
            });

        app.get('/logout', function(req, res) {
            req.logout();
            res.redirect('/');
        });

        newapp = Object.assign({}, app)

        resolve()
    })
}

// Simple route middleware to ensure user is authenticated. (Section 4)
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login')
}
module.exports = { users, newapp, ensureAuthenticated, initPassport }