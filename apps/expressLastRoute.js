'use strict'

const helpers = require('../apps/helpers')
const log = helpers.remoteLog
let logMeta = { js: 'expressLastRoute.js' }
const inspect = require('util').inspect

let addLastRoute = (processObjects) => {
    log('info', 'Adding Last Route', logMeta)
    return new Promise((resolve, reject) => {

        let app = processObjects.app

        app.all('*', (req, res, next) => {//Capture Unhandled routes Here
            let debugTXT='Headers:'+inspect(req.headers) +
                'Params :'+inspect(req.params) + 
                'Query  :'+inspect(req.query) + 
                'Body   :'+inspect(req.body) 
                let debugHTML = '<br>Headers:<pre>'+inspect(req.headers) + '</pre>'+
                '<br>Params :<pre>'+inspect(req.params) + '</pre>'+
                '<br>Query  :<pre>'+inspect(req.query) + '</pre>'+
                '<br>Body   :<pre>'+inspect(req.body) + '</pre>'
            log('warn', 'No Route found for\t:' + req.path + ' -> ' + debugTXT, logMeta)
            res.status(404).send('Sorry No Handler for this request ->'+debugHTML).end()
            return next
        })

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addLastRoute }