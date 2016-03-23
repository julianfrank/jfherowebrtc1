'use strict'

const helpers = require('../apps/helpers')
const log = helpers.log

let addAppRoutes = (processObjects) => {
    log('expressAppRoutes.js\t:Adding Application Routers')
    return new Promise((resolve, reject) => {

        let app = processObjects.app

        app.all('/*.html', (req, res) => {// Need this to load test using loader.io
            res.contentType('text/html')
            res.render(req.params[0])
        })

        app.all('/favicon.ico', (req, res) => {// Show my Pretty Face ;) on the favicon area
            res.contentType('image/x-icon')
            res.redirect('/static/favicon.ico')
        })

        app.all('/', (req, res) => {// Main page
            if (!req.session.lastpath) {
                req.session.lastpath = req.hostname + req.originalUrl + req.path
                log('expressAppRoutes.js\t:No lastpath in session. Setting ' + req.session.lastpath)
            }
            res.contentType('text/html')
            if (req.isAuthenticated()) {
                res.render('secureApp');
            } else {
                res.render('jfmain')
            }
        })

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addAppRoutes }