'use strict'

const helpers = require('../apps/helpers')
const log = helpers.log

let addAzAdRoutes = (processObjects) => {
    log('expressAzAdRoutes.js\t:Adding AzAD Related Routes')
    return new Promise((resolve, reject) => {

        let app = processObjects.app
        let passport = processObjects.passport

        app.get('/oauth2signin',
            passport.authenticate('azuread-openidconnect', { failureRedirect: '/oauth2signin' }),
            function(req, res) {
                log('expressAzAdRoutes.js\t:Login was called in the Sample');
                res.redirect('/');
            });

        // GET /auth/openid
        //   Use passport.authenticate() as route middleware to authenticate the
        //   request.  The first step in OpenID authentication will involve redirecting
        //   the user to their OpenID provider.  After authenticating, the OpenID
        //   provider will redirect the user back to this application at
        //   /auth/openid/return
        app.get('/auth/openid',
            passport.authenticate('azuread-openidconnect', { failureRedirect: '/oauth2signin' }),
            function(req, res) {
                log('expressAzAdRoutes.js\t:Authentication was called in the Sample');
                res.redirect('/');
            })

        // GET /oauth2return
        //   Use passport.authenticate() as route middleware to authenticate the
        //   request.  If authentication fails, the user will be redirected back to the
        //   login page.  Otherwise, the primary route function function will be called,
        //   which, in this example, will redirect the user to the home page.
        app.get('/oauth2return',
            passport.authenticate('azuread-openidconnect', { failureRedirect: '/oauth2signin' }),
            function(req, res) {
                log('expressAzAdRoutes.js\t:We received a GET return from AzureAD.');
                res.render('secureApp');
            });

        // POST /oauth2return
        //   Use passport.authenticate() as route middleware to authenticate the
        //   request.  If authentication fails, the user will be redirected back to the
        //   login page.  Otherwise, the primary route function function will be called,
        //   which, in this example, will redirect the user to the home page.
        app.post('/oauth2return',
            passport.authenticate('azuread-openidconnect', { failureRedirect: '/oauth2signin' }),
            function(req, res) {
                log('expressAzAdRoutes.js\t:We received a POST return from AzureAD.');
                res.render('secureApp');
            });

        app.get('/logout', function(req, res) {
            req.logout();
            res.redirect('/');
        });

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addAzAdRoutes }