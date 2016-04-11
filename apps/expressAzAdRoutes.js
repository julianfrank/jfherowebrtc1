'use strict'

const helpers = require('../apps/helpers')
const log = helpers.log
const inspect = require('util').inspect

let addAzAdRoutes = (processObjects) => {
    log('expressAzAdRoutes.js\t:Adding AzAD Related Routes')
    return new Promise((resolve, reject) => {

        let app = processObjects.app
        let passport = processObjects.passport
        let userMan = processObjects.userManager

        app.get('/oauth2signin', passport.authenticate('azuread-openidconnect', { failureRedirect: '/oauth2signin', failureFlash: true }),
            (req, res) => {
                log('expressAzAdRoutes.js\t:Login was called in the Sample')
                req.session.save((err) => {
                    if (err === null) {
                        log('expressAzAdRoutes.js\t:Error while saving session in oauth2signin ' + err)
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
                log('expressAzAdRoutes.js\t:We received a GET return from AzureAD.')
                req.session.save((err) => {
                    //if (err === null) log('expressAzAdRoutes.js\t:Error while saving session GET->oauth2return ' + err) 
                })
                res.location('https://lab4jf.in')
                res.render('secureApp')
            })

        // POST /oauth2return
        //   Use passport.authenticate() as route middleware to authenticate the
        //   request.  If authentication fails, the user will be redirected back to the
        //   login page.  Otherwise, the primary route function function will be called,
        //   which, in this example, will redirect the user to the home page.
        app.post('/oauth2return', passport.authenticate('azuread-openidconnect', { failureRedirect: '/oauth2signin', failureFlash: true }),
            (req, res) => {
                log('expressAzAdRoutes.js\t:We received a POST return from AzureAD.')
                req.session.save((err) => { if (err === null) log('expressAzAdRoutes.js\t:Error while saving session POST->oauth2return ' + err) })
                res.location('https://lab4jf.in')
                res.render('secureApp')
            })

        app.get('/logout', (req, res) => {
            if (typeof req.user != 'undefined') {
                log('expressAzAdRoutes.js\t:Logout Initiated for user ->' + inspect(req.user.email))
                userMan.removeUser(req.user.email)
                req.logout()
                let sid = req.session.id
                req.session.destroy((err) => {
                    if (err) {
                        log('expressAzAdRoutes.js\t: Session ' + sid + ' Destroy attempted with error-> ' + err)
                    } else {
                        log('expressAzAdRoutes.js\t: Session ' + sid + ' Destroyed')
                    }
                })
            }
            res.redirect('/')
        })

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addAzAdRoutes }