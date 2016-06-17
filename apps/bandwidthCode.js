'use strict'

const helpers = require('../apps/helpers')
const log = helpers.remoteLog
let logMeta = { js: 'bandwidthCode.js' }
const inspect = require('util').inspect

const bwUserID = process.env.BWUID || require('../secrets.js').bwUserID
const bwToken = process.env.BWTOKEN || require('../secrets.js').bwToken
const bwSecret = process.env.BWSECRET || require('../secrets.js').bwSecret

//Initialise bandwidth with Authorisation codes
let bandwidth = require('node-bandwidth')
let bwClient = new bandwidth.Client(bwUserID, bwToken, bwSecret)

let initBandwidth = (processObjects) => {
    log('info', 'Initializing bandwidth-node Service', logMeta)
    return new Promise((resolve, reject) => {

        let app = processObjects.app
        let userMan = processObjects.userManager

        //Assign bandwidth and client to Global ProcessObjects
        processObjects.bandwidth = bandwidth
        processObjects.bwClient = bwClient
        // bandwidth handler for Incoming Calls
        app.get('/bwcall', function (req, res) {
            res.status(200).send('bwcall works').end()
        })
        // bandwidth Message HAndler for Incoming messages
        app.get('/bwmsg', function (req, res) {
            res.status(200).send('bwmsg works').end()
        })

        // Insert the Bandwidth App here
        app.get('/bwApp', (req, res) => {
            res.contentType('text/html')
            userMan.getLoggedUsers().then((userList) => {
                let thisUser = (req.session.passport) ? (req.session.passport.user) : ('Guest')
                let userInfo = {
                    user: thisUser,
                    appVer: helpers.readPackageJSON(__dirname, "version"),
                    loggedUserList: userList
                }
                if (req.isAuthenticated()) {
                    res.render('bandwidthApp.html', userInfo)
                } else {
                    res.render('jfmain.html', userInfo)
                }
            })
        })
        resolve(processObjects)
    })
}

let closeBandwidth = (processObjects) => {
    log('info', 'Closing bandwidth Service', logMeta)
    return new Promise((resolve, reject) => {
        //TBD
        resolve(processObjects)
    })
}

module.exports = { initBandwidth, closeBandwidth }