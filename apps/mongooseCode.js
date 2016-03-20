'use strict'

const helpers = require('../apps/helpers')
const log = helpers.log
const util=require('util')

const mdburl = process.env.MDBURL || require('../secrets.js').mongoDBurl
const mdbcreds = process.env.MDBCREDS || require('../secrets.js').mongoDBcreds

let initMongoose = (processObjects) => {
    return new Promise((resolve, reject) => {

        let mongoose = processObjects.mongoose
        let mongoConnection = processObjects.mongoConnection

        mongoose.connect('mongodb://' + mdbcreds + mdburl, () => {
            log('Connected to ' + mdburl)
            //Start the server only if DB is Ready
            mongoConnection.once('open', (err, db) => {
                if (err) {
                    reject('Problem Connecting with ' + mdburl + 'due to ' + err + ' Going to exit')
                } else {
                    process.nextTick(() => resolve(processObjects))
                }
            })
        })
    })
}

let closeMongoose = (processObjects) => {
    return new Promise((resolve, reject) => {

        let mongoConnection = processObjects.mongoConnection

        log('Mongo Being Closed'+util.inspect(mongoConnection))

        mongoConnection.close((err) => {//Centralising Process exit so that DB/Session is closed before exit...
            if ((err) || (mongoConnection === null)) {
                reject('Error While closing Mongoose Connection :' + err + '. Continuing Shutdown Anyway')
            } else {
                log('Closed Mongoose Connection :' + mdburl)
                resolve(processObjects)
            }
        })
    })
}

module.exports = { initMongoose, closeMongoose }