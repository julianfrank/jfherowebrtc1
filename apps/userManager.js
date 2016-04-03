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

            let userArray = []//User Array Initialization [TODO]move to cloudREDIS or MONGODB

            processObjects.userManager.addUser = (profile) => { //Add new Profile to userArray
                userArray.push(profile)//[TODO]Try to add device specific info also
                //log('userManager.js\t:Going to push ' + JSON.stringify(profile) + ' into redis')
                log(inspect(typeof JSON.stringify(profile)))
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
                log('userManager.js\t:User ' + profile.email + ' added to userArray. Total Logged in users => ' + userArray.length)
                umRedisClient.get(profile.email, (err, obj) => {
                    if (err) {
                        log('userManager.js\t: Problem in get -> ' + err)
                    } else {
                        log('userManager.js\t: get works -> [' + typeof obj + '] ->' + inspect(obj))
                    }
                })
            }

            processObjects.userManager.findUserByEmail = (email, cb) => {//Function used by Passport Deserializer to find email in userArray 
                let target = userArray.filter((value, index, array) => {
                    return (value.email === email)
                })
                log('userManager.js\t:Searching for email ' + email + '. Resultant Array =>' + inspect(target.map((x) => { return x.name })))
                if (target.length === 1) {
                    return cb(null, target[0])
                } else {
                    return cb(null, null)
                }
            }

            processObjects.userManager.removeUser = (email) => { //Add new Profile to userArray
                log('userManager.js\t:User ' + email + ' Removed from userArray. Array now is => ' + inspect(userArray.map((x) => { return x.email })))
                userArray = userArray.filter((val) => { return (val.email != email) })
            }

            processObjects.userManager.getLoggedUsers = () => {
                return userArray.map((x) => { return x.email })
            }

        }
        processObjects.userManager()

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addUserManager }