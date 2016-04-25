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
        let testNSP = io.of('/test')
        testNSP.use((socket, next) => {
            let thisUser = socket.handshake.headers.cookie
            log('debug', ' connection event -> ' + thisUser, logMeta)

            socket.on('disconnect', () => { log('debug', ' disconnect event ->' + thisUser, logMeta) })

            socket.on('lookup', (status) => { log('debug', ' lookup Event -> ' + inspect(status), logMeta) })

            socket.on('client ready', (data) => {
                userMan.getLoggedUsers((userList) => {
                    let returnStuff = inspect({
                        loggedUsers: userList,
                        'handshake.headers': socket.handshake.headers,
                        'request.headers': socket.request.headers,
                        socketid: socket.request.headers.cookie,
                        time: Date()
                    })
                    return socket.emit('server ready', returnStuff)
                })
            })
            if (socket.request.headers.cookie) return next();
        })
        //demo Namespace
        let demoNSP = io.of('/demo')
        demoNSP.on('connection', (socket) => {
            socket.join('demoRoom')

            let thisUser = socket.handshake.headers.cookie
            log('debug', 'demo connection event -> ' + thisUser, logMeta)

            socket.on('disconnect', () => { log('debug', 'demo disconnect event ->' + thisUser, logMeta) })

            socket.on('lookup', (status) => { log('debug', 'demo lookup Event -> ' + inspect(status), logMeta) })

            socket.on('dclient ready', (data) => {
                let returnStuff = { message: 'Server Ready' }
                return socket.broadcast.to('demoRoom').emit('dserver ready', JSON.stringify(returnStuff) + Date())
            })

            socket.on('demoC2S', ( msg) => {
                log('debug',  'demoC2S sent '+msg, logMeta)
                return socket.emit('demoS2C', Date() + msg)
            })
        })

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addSocketIOServices }