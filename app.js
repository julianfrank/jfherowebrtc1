'use strict'

let app = require('./apps/server.js').server

if (process.env.TRAVIS === 'YES') {
    console.log('app.js\t:Not Proceeding to load app as this is inside Travis')
} else {
    console.log('app.js\t:Loading app')
    app()
}
