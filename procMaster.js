'use strict'

//const cluster = require('cluster')
//var sticky = require('sticky-session')
//require('newrelic')
let workerApp = require('./apps/workerApp').workerApp
//const num_processes = require('os').cpus().length;
const log = require('./apps/helpers').remoteLog
let logMeta = { js: 'procMaster.js' }

log('info', 'Going to start the WRTC app', logMeta)
//require("applicationinsights").setup("fbft0kqhe4726o4xxpsp3z1etx8yj8t4pjbib62s").start()

//Run mainApp only if not inside TRAVIS
if (process.env.TRAVIS === 'YES') {
    log('Warn', 'Not Proceeding to load app as this is inside Travis')
} else {
    mainApp()
}

function mainApp() {
    log('info', 'Going to start the WRTC Process', logMeta)
    workerApp()
}