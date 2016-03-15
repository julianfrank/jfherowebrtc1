'use strict'

function initRedis(redis, log, redisClient, redisSessionStore, redisStore, redisLabURL, redisLabPASS) {
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
                            reject()
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
module.exports.initRedis = exports.initRedis = initRedis

function quitRedis(redis, log, redisLabURL, redisClient) {
    console.log(redisClient)
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
                reject()
            }
        })
    })
}
module.exports.quitRedis = exports.quitRedis = quitRedis