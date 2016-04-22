'use strict'

const helpers = require('../apps/helpers')
const log = helpers.remoteLog

let addLastRoute = (processObjects) => {
    log('info', 'expressLastRoute.js\t:Adding Last Route',['expressLastRoute'])
    return new Promise((resolve, reject) => {

        let app = processObjects.app

        app.all('*', (req, res, next) => {//Capture Unhandled routes Here
            log('verbose', 'expressLastRoute.js\t:No Route found for\t:' + req.path,['expressLastRoute'])
            return next
        })

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addLastRoute }