'use strict'

const helpers = require('../apps/helpers')
const log = helpers.remoteLog
let logMeta = { js: 'expressLastRoute.js' }

let addAppRoutes = (processObjects) => {
    log('info','Adding Standard Application Routers',logMeta)
    return new Promise((resolve, reject) => {

        let app = processObjects.app

        app.all('/loaderio-25e297b4d9d2c6ecdb00afc5a49519f4', (req, res) => {// Need this to load test using loader.io
            res.contentType('text/html')
            res.render('loaderio-25e297b4d9d2c6ecdb00afc5a49519f4.html')
        })

        app.all('/favicon.ico', (req, res) => {// Show my Pretty Face ;) on the favicon area
            res.contentType('image/x-icon')
            res.redirect('/static/favicon.ico')//[TODO] Try to implement cache so file need not be read for each request
        })

        app.all('/', (req, res) => {// Main page
            res.contentType('text/html')
            if (req.isAuthenticated()) {
                res.render('secureApp.html');
            } else {
                res.render('jfmain.html')
            }
        })

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addAppRoutes }