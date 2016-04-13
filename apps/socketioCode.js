'use strict'

const helpers = require('../apps/helpers')
const log = helpers.log
const util = require('util')

let addSocketIOServices = (processObjects) => {
    log('socketioCode.js\t:Adding SocketIO Services')
    return new Promise((resolve, reject) => {

        let app = processObjects.app
        let sioPub = processObjects.sioPubRedisClient
        let sioSub = processObjects.sioSubRedisClient

        processObjects.socketIO = require('socket.io')(require('http').Server(app))

        let io = processObjects.socketIO
        var redis = processObjects.redis.createClient
        var sirAdapter = require('socket.io-redis')({ pubClient: sioPub, subClient: sioSub })

        io.adapter(sirAdapter)
        sirAdapter.pubClient.on('error', function(err) { log('socketioCode.js\t:Error in Publisher Service->' + err) })
        sirAdapter.subClient.on('error', function(err) { log('socketioCode.js\t:Error in Subscriber Service->' + err) })

        io.sockets.on('connection', (socket) => {
            socket.on('message', (data) => {
                socket.broadcast.emit('message', data)
                log('SIO Works ' + data)
            })

        })

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addSocketIOServices }