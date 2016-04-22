'use strict'

//const cluster = require('cluster')
//var sticky = require('sticky-session')
require('newrelic')
let workerApp = require('./apps/workerApp').workerApp
//const num_processes = require('os').cpus().length;
const log = require('./apps/helpers').remoteLog

//Run mainApp only if not inside TRAVIS
if (process.env.TRAVIS === 'YES') {
    log('Warn','Not Proceeding to load app as this is inside Travis')
} else {
    mainApp()
}

function mainApp() {
    log('info','Going to start the WRTC app',['procMaster.js'])
    workerApp()
}