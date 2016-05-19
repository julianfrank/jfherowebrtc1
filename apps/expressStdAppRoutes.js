'use strict'

const helpers = require('../apps/helpers')
const inspect = require('util').inspect
const log = helpers.remoteLog
const logMeta = { js: 'expressLastRoute.js' }

let addAppRoutes = (processObjects) => {
    log('info', 'Adding Standard Application Routers', logMeta)
    return new Promise((resolve, reject) => {

        let app = processObjects.app
        let userMan = processObjects.userManager

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
            userMan.getLoggedUsers().then((userList) => {
                let userInfo = {
                    user: (req.session.passport) ? (req.session.passport.user) : ('Guest'),
                    appVer: helpers.readPackageJSON(__dirname, "version"),
                    loggedUserList: userList
                }
                if (req.isAuthenticated()) {
                    res.render('secureApp.html', userInfo)
                } else {
                    res.render('jfmain.html', userInfo)
                }
            })
        })

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addAppRoutes }