'use strict'
const util = require('util')
const helpers = require('../apps/helpers')

const log = helpers.log
const redisLabURL = process.env.REDISURL || require('../secrets.js').redisurl
const redisLabPASS = process.env.REDISCREDS || require('../secrets.js').rediscreds

function initRedis(processObjects) {
    log('redisCode.js\t:Initializing Redis')
    return new Promise((resolve, reject) => {

        const redisRetryStrategy = (options) => {
            log('redisCode.js\t:Redis Retry being Executed using options-> ' + util.inspect(options))
            if (options.error.code === 'ECONNREFUSED') { return new Error('The RedisLab server refused the connection'); }// End reconnecting on a specific error and flush all commands with a individual error
            if (options.total_retry_time > 1000 * 60 * 60) { return new Error('RedisLab Retry time exhausted'); }// End reconnecting after a specific timeout and flush all commands with a individual error
            if (options.times_connected > 10) { return undefined; }// End reconnecting with built in error
            return Math.max(options.attempt * 100, 3000);// reconnect after
        }

        processObjects.redisClient = processObjects.redis.createClient({
            url: 'redis://' + redisLabURL,
            retry_strategy: redisRetryStrategy,
            prefix: 'main.'
        })

        processObjects.redisClient.auth(redisLabPASS, () => {
            processObjects.redisClient.info((err, reply) => {
                if (err) {
                    reject('redisCode.js\t:Error Returned by Redis Server :' + err)
                } else {
                    log('redisCode.js\t:Connected to ' + redisLabURL)
                    processObjects.redisSessionStore = new processObjects.redisStore({// create new redis store for Session Management 
                        url: 'redis://' + redisLabURL,
                        client: processObjects.redisClient,
                        ttl: 360,
                        prefix: 'session.'
                    })
                    processObjects.redisSessionStore.client.info((err, reply) => {
                        if (err) {
                            reject('redisCode.js\t:Error Returned by Redis Server :' + err)
                        } else {
                            log('redisCode.js\t:Redis Session Store Created Successfully')
                            process.nextTick(() => resolve(processObjects))//Ensure we proceed only if Redis is connected and RedisSessionstore is working
                        }
                    })
                }
            })
        })
    })
}

function quitRedis(processObjects) {
    log('redisCode.js\t:Quiting Redis')
    return new Promise((resolve, reject) => {
        processObjects.redisClient.quit((err, res) => {
            if (res === 'OK') {
                log('redisCode.js\t:Quit Redis Connection: ' + redisLabURL)
                processObjects.redisSessionStore.client.quit((err, res) => {
                    if (res === 'OK') log('redisCode.js\t:Alert! Redis Session Still seems Not Closed. Continuing to End Process Anyway')
                    resolve(processObjects)
                })
            } else {
                log('redisCode.js\t:Error: Redis Connection not Closed. Redis Server Says\tResult:' + res + '\tError:' + err + ' Continuing to End Process Anyway')
                reject(err)
            }
        })
    })
}

module.exports = { initRedis, quitRedis }