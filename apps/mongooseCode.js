'use strict'
const mongoose = require('mongoose')
const helpers = require('../apps/helpers')

const log = helpers.log
const mongoLabURL = process.env.mongoLabURL || require('../secrets.js').mongoDBConnectionString.toString()
let mongoConnection = mongoose.connection

let initMongoose = () => {
    return new Promise((resolve, reject) => {
        mongoose.connect(mongoLabURL, () => {
            log('Connected to ' + mongoLabURL)
            mongoConnection = mongoose.connection
            //Start the server only if DB is Ready
            mongoConnection.once('open', (err, db) => {
                if (err) {
                    log('Problem Connecting with ' + mongoLabURL + 'due to ' + err + ' Going to exit')
                    reject()
                } else {
                    resolve()
                }
            })
        })
    })
}

let closeMongoose = () => {
    return new Promise((resolve, reject) => {
        let mongoConnection = mongoose.connection
        mongoConnection.close((err) => {//Centralising Process exit so that DB/Session is closed before exit...
            if ((err) || (mongoConnection === null)) {
                log('Error While closing Mongoose Connection :' + err + '. Continuing Shutdown Anyway')
                reject()
            } else {
                log('Closed Mongoose Connection : ' + mongoLabURL)
                resolve()
            }
        })
    })
}

module.exports={mongoConnection,initMongoose,closeMongoose}