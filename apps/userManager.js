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

            //add socket.id -> emailid mappings
            processObjects.userManager.addSocket = (socketID, emailID, next) => {
                umRedisClient.set('socketID.' + socketID, emailID, (err, reply) => {
                    if (err) {
                        log('error', 'processObjects.userManager.addSocket Issue with set, returned ' + err, logMeta)
                        return next(false, err)
                    } else {
                        //log('debug', ' set Success, Reply ' + reply, logMeta)
                        umRedisClient.expire('socketID.' + socketID, 1 * 10 * 60, (err, reply) => {//Set to Expire after 10 minutes
                            if (err) {
                                log('error', 'processObjects.userManager.addSocket Issue with expire, returned ' + err, logMeta)
                                return next(false, err)
                            } else {
                                log('debug', ' Update Successful for user ' + emailID + ' SocketID:' + socketID, logMeta)
                                return next(true, null)
                            }
                        })
                    }
                })
            }
            //remove socketid->emaidid mapping
            processObjects.userManager.removeSocket = (socketID, next) => {
                umRedisClient.get('socketID.' + socketID, (err, obj) => {
                    if (err) {
                        log('error', 'processObjects.userManager.removeSocket Problem in get -> ' + err, logMeta)
                        return next(false, err)
                    } else {
                        umRedisClient.del('socketID.' + socketID, (err, reply) => {
                            if (err) {
                                log('error', 'processObjects.userManager.removeSocket Problem in del -> ' + err, logMeta)
                                return next(false, err)
                            } else {
                                log('debug', ' ' + socketID + ' deleted with reply -> ' + inspect(reply), logMeta)
                                return next(true, null)
                            }
                        })
                    }
                })
            }
            //SocketID List LAtest
            processObjects.userManager.getLoggedSocketID = (returnSocketIDList) => {
                return umRedisClient.keys('userMan.socketID.*', (err, reply) => {
                    if (err) {
                        log('error', 'processObjects.userManager.getLoggedSocketID resulted in error -> ' + err, logMeta)
                        return null
                    } else {
                        //log('debug', ' getLoggedSocketID resulted in -> ' + reply, logMeta)
                        let SocketIDList = reply.map((val) => { return val.slice(17) })
                        if (typeof returnSocketIDList === 'function') {
                            return returnSocketIDList(SocketIDList)
                        } else {
                            return JSON.stringify(SocketIDList)//[TODO]Not intended to be used as of now...may need to remove
                        }
                    }
                })
            }

            //Update Property related to user if user exists
            /*processObjects.userManager.updateUser = (emailID, key, value, next) => { //Update User Properties
                if (emailID === 'Guest') {
                    let profile = { email: emailID + value }
                    profile[key] = value
                    umRedisClient.set(profile.email, JSON.stringify(profile), (err, reply) => {
                        if (err) {
                            log('error', ' Issue with set, returned ' + err, logMeta)
                            return next(false, err)
                        } else {
                            //log('debug', ' set Success, Reply ' + reply, logMeta)
                            umRedisClient.expire(profile.email, 1 * 10 * 60, (err, reply) => {//Set to Expire after 10 minutes
                                if (err) {
                                    log('error', ' Issue with expire, returned ' + err, logMeta)
                                    return next(false, err)
                                } else {
                                    log('debug', ' Update Successful for user ' + profile.email + ' Key:' + key + ' Value:' + value, logMeta)
                                    return next(true, null)
                                }
                            })
                        }
                    })
                } else {
                    umRedisClient.get(emailID, (err, reply) => {
                        if (err) {
                            log('error', ' get for ' + emailID + ' Failed with Error -> ' + err, logMeta)
                            return next(false, err)
                        } else {
                            //log('debug', ' get for ' + emailID + ' Succeeded with reply -> ' + reply, logMeta)
                            if (reply === null) { return next(false, emailID + " not found in Redis") }
                            let profile = JSON.parse(reply)
                            profile[key] = value
                            umRedisClient.set(profile.email, JSON.stringify(profile), (err, reply) => {
                                if (err) {
                                    log('error', ' Issue with set, returned ' + err, logMeta)
                                    return next(false, err)
                                } else {
                                    //log('debug', ' set Success, Reply ' + reply, logMeta)
                                    umRedisClient.expire(profile.email, 8 * 60 * 60, (err, reply) => {//Set to Expire after 8 hours
                                        if (err) {
                                            log('error', ' Issue with expire, returned ' + err, logMeta)
                                            return next(false, err)
                                        } else {
                                            log('debug', ' Update Successful for user ' + profile.email + ' Key:' + key + ' Value:' + value, logMeta)
                                            return next(true, null)
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            }*/

            //All Below functions are for User Authentication with AzureAD

            // Add new User on successful Login
            processObjects.userManager.addUser = (profile) => { //Add new Profile to userArray
                umRedisClient.set('user.' + profile.email, JSON.stringify(profile), (err, reply) => {
                    if (err) {
                        log('error', 'processObjects.userManager.addUser Issue with set, returned ' + err, logMeta)
                    } else {
                        //log('debug', ' set Success, Reply ' + reply, logMeta)
                        umRedisClient.expire('user.' + profile.email, 8 * 60 * 60, (err, reply) => {//Set to Expire after 8 hours
                            if (err) {
                                log('error', 'processObjects.userManager.addUser Issue with expire, returned ' + err, logMeta)
                            } else {
                                //log('debug', ' expire Success, Reply ' + reply, logMeta)
                            }
                        })
                        log('debug', 'User ' + profile.email + ' added to userManager', logMeta)
                    }
                })

            }

            processObjects.userManager.findUserByEmail = (email, cb) => {//Function used by Passport Deserializer to find email in userArray 
                umRedisClient.get('user.' + email, (err, reply) => {
                    if (err) {
                        log('error', 'processObjects.userManager.findUserByEmail get for ' + email + ' Failed with Error -> ' + err, logMeta)
                        return cb(null, null)
                    } else {
                        //log('debug',' get for ' + email + ' Succeeded with reply -> ' + reply,logMeta)
                        return cb(null, JSON.parse(reply))
                    }
                })
            }

            processObjects.userManager.removeUser = (email) => {
                umRedisClient.get('user.' + email, (err, obj) => {
                    if (err) {
                        log('error', 'processObjects.userManager.removeUser Problem in get -> ' + err, logMeta)
                    } else {
                        umRedisClient.del('user.' + email, (err, reply) => {
                            if (err) {
                                log('error', 'processObjects.userManager.removeUser Problem in del -> ' + err, logMeta)
                            } else {
                                log('debug', ' ' + email + ' deleted with reply -> ' + inspect(reply), logMeta)
                            }
                        })
                    }
                })
            }

            processObjects.userManager.getLoggedUsers = (returnUserList) => {
                return umRedisClient.keys('userMan.user.*', (err, reply) => {
                    if (err) {
                        log('error', 'processObjects.userManager.getLoggedUserss resulted in error -> ' + err, logMeta)
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