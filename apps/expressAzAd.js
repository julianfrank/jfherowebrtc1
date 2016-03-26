'use strict'
const helpers = require('../apps/helpers')
const log = helpers.log
const util = require('util')

let addAzAd = (processObjects) => {
    log('expressAzAd.js\t:Initializing Passport AzAD Middleware')
    return new Promise((resolve, reject) => {
        const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
        const BearerStrategy = require('passport-azure-ad').BearerStrategy

        // array to hold logged in users
        let users=[]
        processObjects.users = users
        let passport = processObjects.passport

        passport.serializeUser(function(user, done) {
            log('expressAzAd.js\t:\tSerializing user.email=' + user.email)
            done(null, user.email);
        });
        passport.deserializeUser(function(id, done) {
            log('expressAzAd.js\t:\tDeserializing id = ' + id)
            findByEmail(id, function(err, user) {
                log('expressAzAd.js\t:\tDeserializing user = ' + user + ' Error: ' + err)
                done(err, user);
            });
        });
        var findByEmail = function(email, fn) {
            for (var i = 0, len = users.length; i < len; i++) {
                var user = users[i];
                if (user.email === email) {
                    log('expressAzAd.js\t:we are using user: ', user.email);
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
                    return done(new Error("expressAzAd.js\t:No email found"), null);
                }
                // asynchronous verification, for effect...
                process.nextTick(function() {
                    findByEmail(profile.email, function(err, user) {
                        if (err) {
                            return done(err);
                        }
                        if (!user) {
                            log('expressAzAd.js\t:Profile being Added -' + profile._raw)
                            // "Auto-registration"
                            users.push(profile);
                            return done(null, profile);
                        }
                        log('expressAzAd.js\t:Logged in User Table -' + users.length)
                        return done(null, user);
                    });
                });
            }
        ));

        log('expressAzAd.js\t:Adding Passport AzAD Middleware to Express')

        let app = processObjects.app
        // Initialize Passport!  Also use passport.session() middleware, to support
        // persistent login sessions (recommended).
        app.use(passport.initialize());
        app.use(passport.session());
        //Simple Middleware to add authentication into routes added after this module available with processObjects
        processObjects.ensureAuthenticated = (req, res, next) => {
            if (req.isAuthenticated()) {
                return next();
            } else {
                res.redirect('/oauth2signin')
            }
        }

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addAzAd }