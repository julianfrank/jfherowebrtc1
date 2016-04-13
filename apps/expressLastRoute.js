'use strict'

const helpers = require('../apps/helpers')
const log = helpers.log

let addLastRoute = (processObjects) => {
    log('expressLastRoute.js\t:Adding Last Route')
    return new Promise((resolve, reject) => {

        let app = processObjects.app

        app.all('*', (req, res,next) => {//Capture Unhandled routes Here
            log('expressLastRoute.js\t:No Route found for\t:' + req.path)
            return next
        })

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addLastRoute }