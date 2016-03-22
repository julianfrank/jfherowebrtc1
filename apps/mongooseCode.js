'use strict'

const helpers = require('../apps/helpers')
const log = helpers.log
const util = require('util')

const mdburl = process.env.MDBURL || require('../secrets.js').mongoDBurl
const mdbcreds = process.env.MDBCREDS || require('../secrets.js').mongoDBcreds

let initMongoose = (processObjects) => {
    log('mongooseCode.js\t:Initializing MongoDB')
    return new Promise((resolve, reject) => {
        processObjects.mongoose.connect('mongodb://' + mdbcreds + mdburl, () => {
            //Start the server only if DB is Ready
            processObjects.mongoConnection.once('open', (err, db) => {
                if (err) {
                    reject('mongooseCode.js\t:Problem Connecting with ' + mdburl + 'due to ' + err + ' Going to exit')
                } else {

                    log('mongooseCode.js\t:Connected to ' + mdburl)
                    process.nextTick(() => resolve(processObjects))
                }
            })
        })
    })
}

let closeMongoose = (processObjects) => {
    log('mongooseCode.js\t:Closing MongoDB')
    return new Promise((resolve, reject) => {
        processObjects.mongoConnection.close((err) => {//Centralising Process exit so that DB/Session is closed before exit...
            if ((err) || (processObjects.mongoConnection === null)) {
                reject('mongooseCode.js\t:Error While closing Mongoose Connection :' + err + '. Continuing Shutdown Anyway')
            } else {
                log('mongooseCode.js\t:Closed Mongoose Connection :' + mdburl)
                resolve(processObjects)
            }
        })
    })
}

module.exports = { initMongoose, closeMongoose }