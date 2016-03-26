'use strict'

const helpers = require('../apps/helpers')
const log = helpers.log
const util = require('util')

let addSignalRoutes = (processObjects) => {
    log('signallingRoutes.js\t:Adding Signalling Routers')
    return new Promise((resolve, reject) => {

        let app = processObjects.app
        let authCheck = processObjects.ensureAuthenticated
        let users = processObjects.users

        app.all('/signal/me', authCheck, (req, res) => {// Need this to load test using loader.io
            res.type('json')
            res.send(util.inspect(users))
        })

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addSignalRoutes }