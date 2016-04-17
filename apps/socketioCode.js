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

        //let server=processObjects.server //Just testing node socket directly

        io.on('connection', function (socket) {
            console.log('a user connected');

            socket.on('disconnect', function () {
                console.log('user disconnected');
            })

            socket.on('lookup', (status) => {
                console.log(inspect(status))
            })


            io.on('connection', (socket) => {
                socket.on('client ready', (data) => {
                    socket.emit('server ready',  inspect(socket.handshake))
                })
            })

        });

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addSocketIOServices }