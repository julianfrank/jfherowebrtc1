'use strict'

const helpers = require('../apps/helpers')
const log = helpers.remoteLog
let logMeta = { js: 'userManager.js' }
const inspect = require('util').inspect

let addUserManager = (processObjects) => {
    log('info', 'Adding User Management Module', logMeta)
    return new Promise((resolve, reject) => {

        let redis = processObjects.redis
        let umRedisClient = processObjects.umRedisClient

        processObjects.userManager = () => {

            processObjects.userManager.addUser = (profile) => { //Add new Profile to userArray
                umRedisClient.set(profile.email, JSON.stringify(profile), (err, reply) => {
                    if (err) {
                        log('error', ' Issue with set, returned ' + err, logMeta)
                    } else {
                        //log('debug', ' set Success, Reply ' + reply, logMeta)
                        umRedisClient.expire(profile.email, 8 * 60 * 60, (err, reply) => {//Set to Expire after 8 hours
                            if (err) {
                                log('error', ' Issue with expire, returned ' + err, logMeta)
                            } else {
                                //log('debug', ' expire Success, Reply ' + reply, logMeta)
                            }
                        })
                        log('debug', 'User ' + profile.email + ' added to userManager', logMeta)
                    }
                })

            }

            processObjects.userManager.updateUser = (emailID, key, value, next) => { //Update User Properties
                umRedisClient.get(emailID, (err, reply) => {
                    if (err) {
                        log('error', ' get for ' + emailID + ' Failed with Error -> ' + err, logMeta)
                        return next(false, err)
                    } else {
                        //log('debug', ' get for ' + emailID + ' Succeeded with reply -> ' + reply, logMeta)
                        if (reply === null) { return next(false, emailID + " not found in Redis") }
                        let profile = JSON.parse(reply)
                        profile[key] = value
                        umRedisClient.set(emailID, JSON.stringify(profile), (err, reply) => {
                            if (err) {
                                log('error', ' Issue with set, returned ' + err, logMeta)
                                return next(false, err)
                            } else {
                                //log('debug', ' set Success, Reply ' + reply, logMeta)
                                umRedisClient.expire(emailID, 8 * 60 * 60, (err, reply) => {//Set to Expire after 8 hours
                                    if (err) {
                                        log('error', ' Issue with expire, returned ' + err, logMeta)
                                        return next(false, err)
                                    } else {
                                        log('debug', ' Update Successful for user ' + emailID + ' Key:' + key + ' Value:' + value, logMeta)
                                        return next(true, null)
                                    }
                                })
                            }
                        })
                    }
                })
            }

            processObjects.userManager.findUserByEmail = (email, cb) => {//Function used by Passport Deserializer to find email in userArray 
                umRedisClient.get(email, (err, reply) => {
                    if (err) {
                        log('error', ' get for ' + email + ' Failed with Error -> ' + err, logMeta)
                        return cb(null, null)
                    } else {
                        //log('debug',' get for ' + email + ' Succeeded with reply -> ' + reply,logMeta)
                        return cb(null, JSON.parse(reply))
                    }
                })
            }

            processObjects.userManager.removeUser = (email) => { //Add new Profile to userArray
                umRedisClient.get(email, (err, obj) => {
                    if (err) {
                        log('error', ' Problem in get -> ' + err, logMeta)
                    } else {
                        umRedisClient.del(email, (err, reply) => {
                            if (err) {
                                log('error', ' Problem in del -> ' + err, logMeta)
                            } else {
                                log('debug', ' ' + email + ' deleted with reply -> ' + inspect(reply), logMeta)
                            }
                        })
                    }
                })
            }

            processObjects.userManager.getLoggedUsers = (returnUserList) => {
                return umRedisClient.keys('userMan.*', (err, reply) => {
                    if (err) {
                        log('error', ' getLoggedUsers resulted in error -> ' + err, logMeta)
                        return null
                    } else {
                        //log('debug', ' getLoggedUsers resulted in -> ' + reply, logMeta)
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