'use strict'

const helpers = require('../apps/helpers')
const log = helpers.remoteLog
let logMeta = { js: 'signallingRoutes.js' }
const inspect = require('util').inspect
let sigmehit = 0

let addSignalRoutes = (processObjects) => {
    log('info', 'Adding Signalling Routers', logMeta)
    return new Promise((resolve, reject) => {

        let app = processObjects.app
        let authCheck = processObjects.ensureAuthenticated
        let userMan = processObjects.userManager

        app.all('/signal/me', (req, res) => {
            res.type('json')
            userMan.getLoggedUsers((userList) => {
                log('info', ' Signalme hit count -> ' + (sigmehit++), logMeta)
                res.send(userList)
            })
        })

        app.get('/whoami', (req, res) => {
            res.send({
                user: (req.session.passport) ? (inspect(req.session.passport.user)) : ('Guest'),
                appVer: helpers.readPackageJSON(__dirname, "version")
            })
        })

        app.all('/gret*', (req, res) => {
            res.type('html')
            res.render(String(req.path).slice(1, -5))
        })

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addSignalRoutes }