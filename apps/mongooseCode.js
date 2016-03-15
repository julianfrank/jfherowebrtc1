'use strict'
const mongoose = require('mongoose')
const helpers = require('../apps/helpers')

const log = helpers.log
const mdbenv = process.env.mongoDB || require('../secrets.js').mongoDB
let mongoConnection = mongoose.connection

let initMongoose = () => {
    return new Promise((resolve, reject) => {
        mongoose.connect(mdbenv.head + mdbenv.creds + mdbenv.url, () => {
            log('Connected to ' + mdbenv.head + mdbenv.url)
            mongoConnection = mongoose.connection
            //Start the server only if DB is Ready
            mongoConnection.once('open', (err, db) => {
                if (err) {
                    log('Problem Connecting with ' + mdbenv.url + 'due to ' + err + ' Going to exit')
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
                log('Closed Mongoose Connection : ' + mdbenv.head + mdbenv.url)
                resolve()
            }
        })
    })
}

module.exports = { mongoConnection, initMongoose, closeMongoose }