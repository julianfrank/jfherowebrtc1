'use strict'

const helpers = require('../apps/helpers')
const log = helpers.remoteLog
let logMeta = { js: 'expressAzAdRoutes.js' }
const inspect = require('util').inspect

let addAzAdRoutes = (processObjects) => {
    log('info','Adding AzAD Related Routes',logMeta)
    return new Promise((resolve, reject) => {

        let app = processObjects.app
        let passport = processObjects.passport
        let userMan = processObjects.userManager

        app.get('/oauth2signin', passport.authenticate('azuread-openidconnect', { failureRedirect: '/oauth2signin', failureFlash: true }),
            (req, res) => {
                log('verbose','Login was called in the Sample',logMeta)
                req.session.save((err) => {
                    if (err === null) {
                        log('error','Error while saving session in oauth2signin ' + err,logMeta)
                    } else {
                        res.redirect('/')
                    }
                })
            })

        // GET /oauth2return
        //   Use passport.authenticate() as route middleware to authenticate the
        //   request.  If authentication fails, the user will be redirected back to the
        //   login page.  Otherwise, the primary route function function will be called,
        //   which, in this example, will redirect the user to the home page.
        app.get('/oauth2return', passport.authenticate('azuread-openidconnect', { failureRedirect: '/oauth2signin', failureFlash: true }),
            (req, res) => {
                log('verbose','We received a GET return from AzureAD.',logMeta)
                //req.session.save((err) => {
                    //if (err === null) log('verbose','Error while saving session GET->oauth2return ' + err,logMeta) 
                //})
                res.redirect('/')
            })

        // POST /oauth2return
        //   Use passport.authenticate() as route middleware to authenticate the
        //   request.  If authentication fails, the user will be redirected back to the
        //   login page.  Otherwise, the primary route function function will be called,
        //   which, in this example, will redirect the user to the home page.
        app.post('/oauth2return', passport.authenticate('azuread-openidconnect', { failureRedirect: '/oauth2signin', failureFlash: true }),
            (req, res) => {
                log('verbose','We received a POST return from AzureAD.',logMeta)
                //req.session.save((err) => { if (err === null) log('verbose','Error while saving session POST->oauth2return ' + err,logMeta) })
                res.redirect('/')
            })

        app.get('/logout', (req, res) => {
            if (typeof req.user != 'undefined') {
                log('verbose','Logout Initiated for user ->' + inspect(req.user.email),logMeta)
                userMan.removeUser(req.user.email)
                req.logout()
                let sid = req.session.id
                req.session.destroy((err) => {
                    if (err) {
                        log('error',' Session ' + sid + ' Destroy attempted with error-> ' + err,logMeta)
                    } else {
                        log('verbose',' Session ' + sid + ' Destroyed',logMeta)
                    }
                })
            }
            res.redirect('/')
        })

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addAzAdRoutes }