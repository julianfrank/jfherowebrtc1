'use strict'
const helpers = require('../apps/helpers')
const log = helpers.remoteLog
const inspect = require('util').inspect

let addAzAd = (processObjects) => {
    log('info', 'expressAzAd.js\t:Initializing Passport AzAD Middleware', ['expressAzAd'])
    return new Promise((resolve, reject) => {
        const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

        //Initiate local vars from Global Variable Package (processObjects)
        let userMan = processObjects.userManager
        let passport = processObjects.passport

        const findByEmail = (email, fn) => {
            log('verbose', 'expressAzAd.js\t:Trying to find email: ' + email, ['expressAzAd'])
            userMan.findUserByEmail(email, fn)
        }
        passport.serializeUser((user, done) => {
            log('verbose', 'expressAzAd.js\t:Serializing user.email=' + user.email, ['expressAzAd'])
            return done(null, user.email)
        });
        passport.deserializeUser((id, done) => {
            log('verbose', 'expressAzAd.js\t:Deserializing id = ' + id)
            findByEmail(id, (err, user) => {
                if (err) {
                    log('error', 'expressAzAd.js\t: Deserializer resulted in error ->' + err, ['expressAzAd'])
                    return done(err, null)
                } else {
                    if (user != null) {
                        log('info', 'expressAzAd.js\t:Deserializing user = ' + user.email, ['expressAzAd'])
                        return done(err, user)
                    } else {
                        log('info', 'expressAzAd.js\t:' + id + ' is not logged in', ['expressAzAd'])
                        return done(err, null)
                    }
                }
            })
        })

        // Use the OIDCStrategy within Passport. (Section 2)  
        //   Strategies in passport require a `validate` function, which accept
        //   credentials (in this case, an OpenID identifier), and invoke a callback
        //   with a user object.
        passport.use(new OIDCStrategy({
            callbackURL: process.env.RETURNURL || require('../secrets.js').returnURL,            //realm: process.env.REALM || require('../secrets.js').realm,
            clientID: process.env.CLIENTID || require('../secrets.js').clientID,
            clientSecret: process.env.CLIENTSECRET || require('../secrets.js').clientSecret,            //oidcIssuer: process.env.ISSUER || require('../secrets.js').issuer,
            identityMetadata: process.env.IDENMETA || require('../secrets.js').identityMetadata,
            skipUserProfile: true,
            responseType: process.env.RESPTYPE || require('../secrets.js').responseType,
            responseMode: process.env.RESPMODE || require('../secrets.js').responseMode,
            validateIssuer: true,
            passReqToCallback: false,
            loggingLevel: 'warn' // valid are 'info', 'warn', 'error'. Error always goes to stderr in Unix.
        },
            (iss, sub, profile, accessToken, refreshToken, done) => {
                log('verbose', 'expressAzAd.js\t:Received Profile-' + inspect(profile.email), ['expressAzAd'])
                if (!profile.email) {
                    return done(new Error("expressAzAd.js\t:Profile does not have Email"), null);
                } else {
                    // asynchronous verification, for effect...
                    process.nextTick(() => {
                        //log('verbose','expressAzAd.js\t:Trying to find email using profile: ' + inspect(profile))
                        findByEmail(profile.email, (err, user) => {
                            if (err) { return done(err) }
                            if (!user) {
                                // "Auto-registration"
                                log('verbose', 'expressAzAd.js\t:Profile being Added for email-' + profile.email, ['expressAzAd'])
                                //Adding access and Refresh Token to Profile
                                profile.accessToken = accessToken
                                profile.refreshToken = refreshToken
                                //Removing all keys with nested JSON for Redis Compatibility
                                delete profile._raw
                                delete profile._json
                                delete profile.name
                                userMan.addUser(profile)
                                return done(null, profile)
                            }
                            return done(null, user);
                        })
                    })
                }

            }
        ))

        log('verbose', 'expressAzAd.js\t:Adding Passport AzAD Middleware to Express', ['expressAzAd'])

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