'use strict'

//const cluster = require('cluster')
//var sticky = require('sticky-session')
require('newrelic')
let workerApp = require('./apps/workerApp.js').workerApp
//const num_processes = require('os').cpus().length;

//Run mainApp only if not inside TRAVIS
if (process.env.TRAVIS === 'YES') {
    console.log('procMaster.js\t:Not Proceeding to load app as this is inside Travis')
} else {
    workerApp()
}