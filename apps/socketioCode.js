'use strict'

const helpers = require('../apps/helpers')
const log = helpers.remoteLog
const inspect = require('util').inspect

let addSocketIOServices = (processObjects) => {
    log('info','socketioCode.js\t:Adding SocketIO Services',['socketioCode'])
    return new Promise((resolve, reject) => {

        let sioPub = processObjects.sioPubRedisClient
        let sioSub = processObjects.sioSubRedisClient
        let io = processObjects.io
        let userMan = processObjects.userManager

        var sirAdapter = require('socket.io-redis')({ pubClient: sioPub, subClient: sioSub })

        io.adapter(sirAdapter)
        sirAdapter.pubClient.on('error', function (err) { log('error','socketioCode.js\t:Error in Publisher Service->' + err,['socketioCode']) })
        sirAdapter.subClient.on('error', function (err) { log('error','socketioCode.js\t:Error in Subscriber Service->' + err,['socketioCode']) })

        let testNSP=io.of('/test')
        testNSP.use((socket, next) => {
            let thisUser = socket.handshake.headers.cookie
            log('verbose','socketioCode.js\t: connection event -> ' + thisUser,['socketioCode'])

            socket.on('disconnect', () => { log('verbose','socketioCode.js\t: disconnect event ->' + thisUser,['socketioCode']) })

            socket.on('lookup', (status) => { log('verbose','socketioCode.js\t: lookup Event -> ' + inspect(status),['socketioCode']) })

            socket.on('client ready', (data) => {
                userMan.getLoggedUsers((userList) => {
                    let returnStuff = inspect({
                        loggedUsers: userList,
                        'handshake.headers': socket.handshake.headers,
                        'request.headers': socket.request.headers,
                        socketid:socket.request.headers.cookie,
                        time: Date()
                    })
                    return socket.emit('server ready', returnStuff)
                })
            })
            if (socket.request.headers.cookie) return next();
        })

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addSocketIOServices }