'use strict'
const redis = require("redis")
const expressSession = require('express-session');
const redisStore = require('connect-redis')(expressSession);
const helpers = require('../apps/helpers')

const log = helpers.log
const redisenv = process.env.redis || require('../secrets.js').redis
const redisLabURL = redisenv.head + redisenv.url
const redisLabPASS = redisenv.creds
let redisClient = null
let redisSessionStore = null

function initRedis() {
    return new Promise((resolve, reject) => {
        const redisRetryStrategy = (options) => {
            log('Redis Retry being Executed')
            if (options.error.code === 'ECONNREFUSED') { return new Error('The RedisLab server refused the connection'); }// End reconnecting on a specific error and flush all commands with a individual error
            if (options.total_retry_time > 1000 * 60 * 60) { return new Error('RedisLab Retry time exhausted'); }// End reconnecting after a specific timeout and flush all commands with a individual error
            if (options.times_connected > 10) { return undefined; }// End reconnecting with built in error
            return Math.max(options.attempt * 100, 3000);// reconnect after
        }
        redisClient = redis.createClient({ url: redisLabURL, retry_strategy: redisRetryStrategy })
        redisClient.auth(redisLabPASS, () => {
            redisClient.info((err, reply) => {
                if (err) {
                    log('Error Returned by Redis Server :' + err)
                    reject()
                } else {
                    log('Connected to ' + redisLabURL)
                    redisSessionStore = new redisStore({ url: redisLabURL, client: redisClient, ttl: 360, prefix: 'session.' })// create new redis store for Session Management
                    redisSessionStore.client.info((err, reply) => {
                        if (err) {
                            log('Error Returned by Redis Server :' + err)
                            reject(err)
                        } else {
                            log('Redis Session Store Created Successfully')
                            resolve()//Ensure we proceed only if Redis is connected and RedisSessionstore is working
                        }
                    })
                }
            })
        })
    })
}

function quitRedis() {
    return new Promise((resolve, reject) => {
        redisClient.quit((err, res) => {
            if (res === 'OK') {
                log('Closed Redis Connection: ' + redisLabURL)
                redisSessionStore.client.quit((err, res) => {
                    if (res === 'OK') log('Alert! Redis Session Still seems Not Closed. Continuing to End Process Anyway')
                    resolve()
                })
            } else {
                log('Error: Redis Connection not Closed. Redis Server Says\tResult:' + res + '\tError:' + err + ' Continuing to End Process Anyway')
                reject(err)
            }
        })
    })
}

module.exports = { initRedis, quitRedis, redisSessionStore }