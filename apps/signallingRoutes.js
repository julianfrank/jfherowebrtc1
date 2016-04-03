'use strict'

const helpers = require('../apps/helpers')
const log = helpers.log
const util = require('util')

let addSignalRoutes = (processObjects) => {
    log('signallingRoutes.js\t:Adding Signalling Routers')
    return new Promise((resolve, reject) => {

        let app = processObjects.app
        //let authCheck = processObjects.ensureAuthenticated
        let userMan = processObjects.userManager

        app.all('/signal/me', (req, res) => {
            res.type('json')
            let loggedUsers = {}
//            userMan.getLoggedUsers().map((val, ind) => { loggedUsers[ind] = val })
            loggedUsers = JSON.stringify(loggedUsers)
            res.send(loggedUsers)
        })

        app.all('/gret*', (req, res) => {
            res.type('html')
            res.render(String(req.path).slice(1, -5))
        })

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addSignalRoutes }