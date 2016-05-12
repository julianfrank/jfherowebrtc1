'use strict'

const helpers = require('../apps/helpers')
const log = helpers.remoteLog
let logMeta = { js: 'socketioCode.js' }
const inspect = require('util').inspect

let addSocketIOServices = (processObjects) => {
    log('info', 'Adding SocketIO Services', logMeta)
    return new Promise((resolve, reject) => {

        let sioPub = processObjects.sioPubRedisClient
        let sioSub = processObjects.sioSubRedisClient
        let io = processObjects.io
        let userMan = processObjects.userManager

        var sirAdapter = require('socket.io-redis')({ pubClient: sioPub, subClient: sioSub })

        io.adapter(sirAdapter)
        sirAdapter.pubClient.on('error', function (err) { log('error', 'Error in Publisher Service->' + err, logMeta) })
        sirAdapter.subClient.on('error', function (err) { log('error', 'Error in Subscriber Service->' + err, logMeta) })

        //Test Namespace
        let sharedio = io
            .of('/shared')
            .on('connection', (socket) => {

                log('info', 'connect happened on sharedio', logMeta)
                socket.emit('s2c', "Message from Server to Client on Shared via socket")
                sharedio.emit('s2c', "Message from Server to Client on Shared via sharedio")

                socket.on('message', (msg) => {
                    log('info', 'Client says ' + msg, logMeta)
                    socket.emit('s2c', 'client says ' + msg + ' using socket')
                    sharedio.emit('s2c', 'Client says ' + msg + ' using sharedio')
                })

                socket.on('disconnect', () => { sharedio.emit('User Disconnected') })
            })

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addSocketIOServices }