'use strict'

const cluster = require('cluster')

let app = require('./apps/server.js').server
const num_processes = require('os').cpus().length;

if (process.env.TRAVIS === 'YES') {
    console.log('app.js\t:Not Proceeding to load app as this is inside Travis')
} else {
    if (cluster.isMaster) {
        console.log('app.js\t:This the Master Process')
        for (let i = 0; i < num_processes; i++) { 
            console.log('app.js\t:Going to fork new process')
            cluster.fork() 
        }
    } else {
        console.log('app.js\t:This is a Slave Process')
        app()
    }
}