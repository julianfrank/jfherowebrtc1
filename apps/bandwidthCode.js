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