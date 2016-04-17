'use strict'

const helpers = require('../apps/helpers')
const log = helpers.log
const inspect = require('util').inspect

let addSocketIOServices = (processObjects) => {
    log('socketioCode.js\t:Adding SocketIO Services')
    return new Promise((resolve, reject) => {

        let sioPub = processObjects.sioPubRedisClient
        let sioSub = processObjects.sioSubRedisClient
        let io = processObjects.io

        var sirAdapter = require('socket.io-redis')({ pubClient: sioPub, subClient: sioSub })

        io.adapter(sirAdapter)
        sirAdapter.pubClient.on('error', function (err) { log('socketioCode.js\t:Error in Publisher Service->' + err) })
        sirAdapter.subClient.on('error', function (err) { log('socketioCode.js\t:Error in Subscriber Service->' + err) })

        io.use((socket, next) => {
            let thisUser = socket.handshake.headers.cookie
            log('socketioCode.js\t: connection event -> ' + thisUser)

            socket.on('disconnect', () => { log('socketioCode.js\t: disconnect event ->' + thisUser) })

            socket.on('lookup', (status) => { log('socketioCode.js\t: lookup Event -> ' + inspect(status)) })

            socket.on('client ready', (data) => {
                let returnStuff = inspect({ socket: socket.handshake, time: Date() })
                socket.emit('server ready', returnStuff)
            })

            return next()
        })

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addSocketIOServices }