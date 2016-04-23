'use strict'
const util = require('util')
const helpers = require('../apps/helpers')
const log = helpers.remoteLog
let logMeta = { js: 'redisCode.js' }

const redisLabURL = process.env.REDISURL || require('../secrets.js').redisurl
const redisLabPASS = process.env.REDISCREDS || require('../secrets.js').rediscreds

const redisRetryStrategy = (options) => {
    log('warn','Redis Retry being Executed using options-> ' + util.inspect(options),logMeta)
    if (options.error.code === 'ECONNREFUSED') { return new Error('The RedisLab server refused the connection'); }// End reconnecting on a specific error and flush all commands with a individual error
    if (options.total_retry_time > 1000 * 60 * 60) { return new Error('RedisLab Retry time exhausted'); }// End reconnecting after a specific timeout and flush all commands with a individual error
    if (options.times_connected > 10) { return undefined; }// End reconnecting with built in error
    return Math.max(options.attempt * 100, 3000);// reconnect after
}

function initRedis(processObjects) {
    log('info','Initializing RedisSessionStore',logMeta)
    return new Promise((resolve, reject) => {

        log('debug','Creating redisClient for Session store',logMeta)
        processObjects.redisClient = processObjects.redis.createClient({
            url: 'redis://' + redisLabURL,
            retry_strategy: redisRetryStrategy,
            prefix: 'redis.'
        })
        processObjects.redisClient.auth(redisLabPASS, () => {
            processObjects.redisClient.info((err, reply) => {
                if (err) {
                    reject('Error Returned by Redis Server :' + err)
                } else {
                    log('debug','redisClient Connected to ' + redisLabURL,logMeta)
                    processObjects.redisSessionStore = new processObjects.redisStore({// create new redis store for Session Management 
                        url: 'redis://' + redisLabURL,
                        client: processObjects.redisClient,
                        ttl: 1 * 10 * 60,//TTL in Seconds...Set to 10 minutes
                        prefix: 'redisSessionStore.'
                    })
                    processObjects.redisSessionStore.client.info((err, reply) => {
                        if (err) {
                            reject('Error Returned by Redis Server :' + err)
                        } else {
                            log('debug','Redis Session Store Created Successfully',logMeta)
                            process.nextTick(() => resolve(processObjects))//Ensure we proceed only if Redis is connected and RedisSessionstore is working
                        }
                    })
                }
            })
        })
    })
}

function quitRedis(processObjects) {
    log('info','Quiting Redis',logMeta)
    return new Promise((resolve, reject) => {
        processObjects.redisClient.quit((err, res) => {
            if (res === 'OK') {
                log('debug','Quit Redis Connection: ' + redisLabURL,logMeta)
                processObjects.redisSessionStore.client.quit((err, res) => {
                    if (res === 'OK') log('error','Alert! Redis Session Still seems Not Closed. Continuing to End Process Anyway',logMeta)
                    resolve(processObjects)
                })
            } else {
                log('error','Redis Connection not Closed. Redis Server Says\tResult:' + res + '\tError:' + err + ' Continuing to End Process Anyway',logMeta)
                reject(err)
            }
        })
    })
}

function initUMRedisClient(processObjects) {
    log('info','Initializing Redis User Management Store',logMeta)
    return new Promise((resolve, reject) => {

        log('debug','Creating umRedisClient for User Management store',logMeta)

        processObjects.umRedisClient = processObjects.redis.createClient({
            url: 'redis://' + redisLabURL,
            retry_strategy: redisRetryStrategy,
            prefix: 'userMan.'
        })

        processObjects.umRedisClient.on("error", (err) => {
            log('debug',"umRedisClient creation Error " + err,logMeta)
            reject(err)
        })

        processObjects.umRedisClient.auth(redisLabPASS, () => {
            processObjects.umRedisClient.info((err, reply) => {
                if (err) {
                    reject('Error Returned by Redis Server :' + err)
                } else {
                    log('debug','umRedisClient Connected to ' + redisLabURL,logMeta)
                    process.nextTick(() => resolve(processObjects))//Ensure we proceed only if Redis is connected and umRedisClient is working
                }
            })
        })
    })
}

function quitUMRedis(processObjects) {
    log('info','Quiting UMRedisClient',logMeta)
    return new Promise((resolve, reject) => {
        processObjects.umRedisClient.quit((err, res) => {
            if (res === 'OK') {
                log('debug','Quit umRedis Connection: ' + redisLabURL,logMeta)
                resolve(processObjects)
            } else {
                log('error','umRedis Connection not Closed. Redis Server Says\tResult:' + res + '\tError:' + err + ' Continuing to End Process Anyway',logMeta)
                reject(err)
            }
        })
    })
}

function initSIOPubRedisClient(processObjects) {
    log('info','Initializing Socket.io Redis Publisher Client',logMeta)
    return new Promise((resolve, reject) => {

        log('debug','Creating sioPubRedisClient for SocketIO Services',logMeta)

        processObjects.sioPubRedisClient = processObjects.redis.createClient({
            url: 'redis://' + redisLabURL,
            retry_strategy: redisRetryStrategy,
            prefix: 'sioPub.'
        })

        processObjects.sioPubRedisClient.on("error", (err) => {
            log('error'," sioPubRedisClient creation Error " + err,logMeta)
            reject(err)
        })

        processObjects.sioPubRedisClient.auth(redisLabPASS, () => {
            processObjects.sioPubRedisClient.info((err, reply) => {
                if (err) {
                    reject('Error Returned by Redis Server :' + err)
                } else {
                    log('debug','sioPubRedisClient Connected to ' + redisLabURL,logMeta)
                    process.nextTick(() => resolve(processObjects))//Ensure we proceed only if Redis is connected and sioPubRedisClient is working
                }
            })
        })
    })
}

function quitSIOPubRedis(processObjects) {
    log('info','Quiting sioPubRedisClient',logMeta)
    return new Promise((resolve, reject) => {
        processObjects.sioPubRedisClient.quit((err, res) => {
            if (res === 'OK') {
                log('debug','Quit sioPubRedisClient Connection: ' + redisLabURL,logMeta)
                resolve(processObjects)
            } else {
                log('error','sioPubRedisClient Connection not Closed. Redis Server Says\tResult:' + res + '\tError:' + err + ' Continuing to End Process Anyway',logMeta)
                reject(err)
            }
        })
    })
}

function initSIOSubRedisClient(processObjects) {
    log('info','Initializing Socket.io Redis Subscriber Client',logMeta)
    return new Promise((resolve, reject) => {

        log('debug','Creating sioSubRedisClient for SocketIO Services',logMeta)

        processObjects.sioSubRedisClient = processObjects.redis.createClient({
            url: 'redis://' + redisLabURL,
            retry_strategy: redisRetryStrategy,
            prefix: 'sioSub.',
            return_buffers: true
        })

        processObjects.sioSubRedisClient.on("error", (err) => {
            log('error',"sioSubRedisClient creation Error " + err,logMeta)
            reject(err)
        })

        processObjects.sioSubRedisClient.auth(redisLabPASS, () => {
            processObjects.sioSubRedisClient.info((err, reply) => {
                if (err) {
                    reject('Error Returned by Redis Server :' + err)
                } else {
                    log('debug','sioSubRedisClient Connected to ' + redisLabURL,logMeta)
                    process.nextTick(() => resolve(processObjects))//Ensure we proceed only if Redis is connected and sioPubRedisClient is working
                }
            })
        })
    })
}

function quitSIOSubRedis(processObjects) {
    log('info','Quiting sioSubRedisClient',logMeta)
    return new Promise((resolve, reject) => {
        processObjects.sioSubRedisClient.quit((err, res) => {
            if (res === 'OK') {
                log('debug','Quit sioSubRedisClient Connection: ' + redisLabURL,logMeta)
                resolve(processObjects)
            } else {
                log('error','sioSubRedisClient Connection not Closed. Redis Server Says\tResult:' + res + ' Error:' + err + ' Continuing to End Process Anyway',logMeta)
                reject(err)
            }
        })
    })
}

module.exports = {
    initRedis, quitRedis,
    initUMRedisClient, quitUMRedis,
    initSIOPubRedisClient, quitSIOPubRedis,
    initSIOSubRedisClient, quitSIOSubRedis
}