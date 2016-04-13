'use strict'

const helpers = require('../apps/helpers')
const log = helpers.log
const inspect = require('util').inspect

let addUserManager = (processObjects) => {
    log('userManager.js\t:Adding User Management Module')
    return new Promise((resolve, reject) => {

        let redis = processObjects.redis
        let umRedisClient = processObjects.umRedisClient

        processObjects.userManager = () => {

            processObjects.userManager.addUser = (profile) => { //Add new Profile to userArray
                umRedisClient.set(profile.email, JSON.stringify(profile), (err, reply) => {
                    if (err) {
                        log('userManager.js\t: Issue with set, returned ' + err)
                    } else {
                        log('userManager.js\t: set Success, Reply ' + reply)
                    }
                })
                umRedisClient.expire(profile.email, 8 * 60 * 60, (err, reply) => {//Set to Expire after 8 hours
                    if (err) {
                        log('userManager.js\t: Issue with expire, returned ' + err)
                    } else {
                        log('userManager.js\t: expire Success, Reply ' + reply)
                    }
                })
                log('userManager.js\t:User ' + profile.email + ' added to userManager')
            }

            processObjects.userManager.findUserByEmail = (email, cb) => {//Function used by Passport Deserializer to find email in userArray 
                umRedisClient.get(email, (err, reply) => {
                    if (err) {
                        log('userManager.js\t: get for ' + email + ' Failed with Error -> ' + err)
                        return cb(null, null)
                    } else {
                        //log('userManager.js\t: get for ' + email + ' Succeeded with reply -> ' + reply)
                        return cb(null, JSON.parse(reply))
                    }
                })
            }

            processObjects.userManager.removeUser = (email) => { //Add new Profile to userArray
                umRedisClient.get(email, (err, obj) => {
                    if (err) {
                        log('userManager.js\t: Problem in get -> ' + err)
                    } else {
                        umRedisClient.del(email, (err, reply) => {
                            if (err) {
                                log('userManager.js\t: Problem in del -> ' + err)
                            } else {
                                log('userManager.js\t: ' + email + ' deleted with reply -> ' + inspect(reply))
                            }
                        })
                    }
                })

                log('userManager.js\t:User ' + email + ' Removed from userManager')
            }

            processObjects.userManager.getLoggedUsers = (res, returnUserList) => {
                let loggedUsers = umRedisClient.keys('userMan.*', (err, reply) => {
                    if (err) {
                        log('userManager.js\t: getLoggedUsers resulted in error -> ' + err)
                        return null
                    } else {
                        log('userManager.js\t: getLoggedUsers resulted in -> ' + reply)
                        return returnUserList(res, reply.map((val) => { return val.slice(8) }))
                    }
                })
            }

        }
        processObjects.userManager()

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addUserManager }