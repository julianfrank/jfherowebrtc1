'use strict'

const helpers = require('../apps/helpers')
const log = helpers.remoteLog
const inspect = require('util').inspect

let addUserManager = (processObjects) => {
    log('info','userManager.js\t:Adding User Management Module',['userManager'])
    return new Promise((resolve, reject) => {

        let redis = processObjects.redis
        let umRedisClient = processObjects.umRedisClient

        processObjects.userManager = () => {

            processObjects.userManager.addUser = (profile) => { //Add new Profile to userArray
                umRedisClient.set(profile.email, JSON.stringify(profile), (err, reply) => {
                    if (err) {
                        log('error','userManager.js\t: Issue with set, returned ' + err,['userManager'])
                    } else {
                        log('verbose','userManager.js\t: set Success, Reply ' + reply,['userManager'])
                    }
                })
                umRedisClient.expire(profile.email, 8 * 60 * 60, (err, reply) => {//Set to Expire after 8 hours
                    if (err) {
                        log('error','userManager.js\t: Issue with expire, returned ' + err,['userManager'])
                    } else {
                        log('verbose','userManager.js\t: expire Success, Reply ' + reply,['userManager'])
                    }
                })
                log('verbose','userManager.js\t:User ' + profile.email + ' added to userManager',['userManager'])
            }

            processObjects.userManager.findUserByEmail = (email, cb) => {//Function used by Passport Deserializer to find email in userArray 
                umRedisClient.get(email, (err, reply) => {
                    if (err) {
                        log('error','userManager.js\t: get for ' + email + ' Failed with Error -> ' + err,['userManager'])
                        return cb(null, null)
                    } else {
                        //log('verbose','userManager.js\t: get for ' + email + ' Succeeded with reply -> ' + reply,['userManager'])
                        return cb(null, JSON.parse(reply))
                    }
                })
            }

            processObjects.userManager.removeUser = (email) => { //Add new Profile to userArray
                umRedisClient.get(email, (err, obj) => {
                    if (err) {
                        log('error','userManager.js\t: Problem in get -> ' + err,['userManager'])
                    } else {
                        umRedisClient.del(email, (err, reply) => {
                            if (err) {
                                log('error','userManager.js\t: Problem in del -> ' + err,['userManager'])
                            } else {
                                log('verbose','userManager.js\t: ' + email + ' deleted with reply -> ' + inspect(reply),['userManager'])
                            }
                        })
                    }
                })

                log('verbose','userManager.js\t:User ' + email + ' Removed from userManager',['userManager'])
            }

            processObjects.userManager.getLoggedUsers = (returnUserList) => {
                return umRedisClient.keys('userMan.*', (err, reply) => {
                    if (err) {
                        log('error','userManager.js\t: getLoggedUsers resulted in error -> ' + err,['userManager'])
                        return null
                    } else {
                        log('verbose','userManager.js\t: getLoggedUsers resulted in -> ' + reply,['userManager'])
                        let userList = reply.map((val) => { return val.slice(8) })
                        if (typeof returnUserList === 'function') {
                            return returnUserList(userList)
                        } else {
                            return JSON.stringify(userList)//[TODO]Not intended to be used as of now...may need to remove
                        }
                    }
                })
            }
        }
        processObjects.userManager()

        return process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addUserManager }