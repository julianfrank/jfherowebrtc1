'use strict'

const helpers = require('../apps/helpers')
const log = helpers.remoteLog
let logMeta = { js: 'expressLastRoute.js' }

let addLastRoute = (processObjects) => {
    log('info', 'Adding Last Route',logMeta)
    return new Promise((resolve, reject) => {

        let app = processObjects.app

        app.all('*', (req, res, next) => {//Capture Unhandled routes Here
            log('warn', 'No Route found for\t:' + req.path,logMeta)
            return next
        })

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addLastRoute }