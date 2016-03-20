'use strict'
const utils = require('util')
const helpers = require('../apps/helpers')

const log = helpers.log
const redisLabURL = process.env.REDISURL || require('../secrets.js').redisurl
const redisLabPASS = process.env.REDISCREDS || require('../secrets.js').rediscreds

function initRedis(processObjects) {
    return new Promise((resolve, reject) => {
        const redisRetryStrategy = (options) => {
            log('Redis Retry being Executed')
            if (options.error.code === 'ECONNREFUSED') { return new Error('The RedisLab server refused the connection'); }// End reconnecting on a specific error and flush all commands with a individual error
            if (options.total_retry_time > 1000 * 60 * 60) { return new Error('RedisLab Retry time exhausted'); }// End reconnecting after a specific timeout and flush all commands with a individual error
            if (options.times_connected > 10) { return undefined; }// End reconnecting with built in error
            return Math.max(options.attempt * 100, 3000);// reconnect after
        }
        processObjects.redisClient = processObjects.redis.createClient({ url: 'redis://' + redisLabURL, retry_strategy: redisRetryStrategy })
        processObjects.redisClient.auth(redisLabPASS, () => {
            processObjects.redisClient.info((err, reply) => {
                if (err) {
                    reject('Error Returned by Redis Server :' + err)
                } else {
                    log('Connected to ' + redisLabURL)
                    processObjects.redisSessionStore = new processObjects.redisStore({ url: 'redis://' + redisLabURL, client: processObjects.redisClient, ttl: 360, prefix: 'session.' })// create new redis store for Session Management
                    processObjects.redisSessionStore.client.info((err, reply) => {
                        if (err) {
                            reject('Error Returned by Redis Server :' + err)
                        } else {
                            log('Redis Session Store Created Successfully')
                            //log(utils.inspect(processObjects))
                            process.nextTick(() => resolve(processObjects))//Ensure we proceed only if Redis is connected and RedisSessionstore is working
                        }
                    })
                }
            })
        })
    })
}

function quitRedis(processObjects) {
    return new Promise((resolve, reject) => {

        let redisClient = processObjects.redisClient

        redisClient.quit((err, res) => {
            if (res === 'OK') {
                log('Closed Redis Connection: ' + redisLabURL)
                redisSessionStore.client.quit((err, res) => {
                    if (res === 'OK') log('Alert! Redis Session Still seems Not Closed. Continuing to End Process Anyway')
                    resolve(processObjects)
                })
            } else {
                log('Error: Redis Connection not Closed. Redis Server Says\tResult:' + res + '\tError:' + err + ' Continuing to End Process Anyway')
                reject(err)
            }
        })
    })
}

module.exports = { initRedis, quitRedis }