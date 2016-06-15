'use strict'

const helpers = require('../apps/helpers')
const log = helpers.remoteLog
let logMeta = { js: 'twillioCode.js' }
const inspect = require('util').inspect

const twASID = process.env.TWASID || require('../secrets.js').twAccountSid
const twAuthToken = process.env.TWAUTHTOKEN || require('../secrets.js').twAuthToken
const outtwiMLSID = process.env.TWAUTHTOKEN || require('../secrets.js').twOUTTwiMLSID

let initTwilio = (processObjects) => {
    log('info', 'Initializing Twilio-node Service', logMeta)
    return new Promise((resolve, reject) => {

        let app = processObjects.app
        let userMan = processObjects.userManager

        //Initialise Twilio with Authorisation codes
        let twilio = require('twilio')

        //Inserting Capability Token Generation Function
        processObjects.genTwCap = (user, capArray, timeout) => {
            let twCap = new twilio.Capability(twASID, twAuthToken)
            let twCapTimeout = timeout || 600// Use 5 mins (600 seconds) as timeout if not provided 
            return new Promise((resolve, reject) => {
                capArray.map((val, ind, array) => {
                    switch (val) {
                        case 'in':
                            twCap.allowClientIncoming(user)
                            break
                        case 'out':
                            twCap.allowClientOutgoing(outtwiMLSID)
                            break
                        default:
                            log('error', 'Unknown twilio Capability code provided -> ' + val, logMeta)
                            break
                    }
                })
                resolve(twCap.generate(twCapTimeout))
            })
        }
        //processObjects.genTwCap('guest@jfkalab.onmicrosoft.com', ['in', 'out', 'unknown']).then((token) => { log('info', 'twilio capability token generated -> ' + token, logMeta) })//Testing genTwCap

        // Twilio request authentication for Requests FROM Twilio
        app.get('/twauth', function (req, res) {
            if (twilio.validateExpressRequest(req, twAuthToken)) {
                let resp = new twilio.TwimlResponse()
                resp.say('Julian Frank Says hello twilio!')

                res.type('text/xml')
                res.send(resp.toString())
            }
            else {
                res.status(403).send('you are not twilio. Buzz off.')
            }
        })
        // Insert the Twilio App here
        app.get('/twilioApp', (req, res) => {
            res.contentType('text/html')
            userMan.getLoggedUsers().then((userList) => {
                let userInfo = {
                    user: (req.session.passport) ? (req.session.passport.user) : ('Guest'),
                    appVer: helpers.readPackageJSON(__dirname, "version"),
                    loggedUserList: userList
                }
                if (req.isAuthenticated()) {
                    res.render('twilioApp.html', userInfo)
                } else {
                    res.render('jfmain.html', userInfo)
                }
            })
        })

        resolve(processObjects)
    })
}

let closeTwilio = (processObjects) => {
    log('info', 'Closing Twilio Service', logMeta)
    return new Promise((resolve, reject) => {
        //TBD
        resolve(processObjects)
    })
}

module.exports = { initTwilio, closeTwilio }