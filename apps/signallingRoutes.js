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
            res.send(util.inspect(userMan.getLoggedUsers()))
        })

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addSignalRoutes }