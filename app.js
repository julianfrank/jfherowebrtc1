'use strict'

//const cluster = require('cluster')
//var sticky = require('sticky-session')

let app = require('./apps/server.js').server
//const num_processes = require('os').cpus().length;
//const port = process.env.PORT || 80

//Run mainApp only if not inside TRAVIS
if (process.env.TRAVIS === 'YES') {
    console.log('app.js\t:Not Proceeding to load app as this is inside Travis')
} else {
    app()
}