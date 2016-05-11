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

            socket.on('client ready', (data) => {
                userMan.getLoggedUsers((userList) => {

                    io.of('/demo').in('demoRoom').clients((err, clients) => {
                        log('debug', clients, logMeta)
                        let returnStuff = inspect({
                            loggedUsers: userList,
                            rooms: socket.rooms,
                            demoRoomClients: clients,
                            id: socket.id,
                            namespace: testNSP.name,
                            'socket.request.headers': socket.request.headers,
                            time: Date()
                        })
                        return socket.emit('server ready', returnStuff)
                    })
                })
            })
            if (socket.request.headers.cookie) return next();
        })
        //demo Namespace
        let demoNSP = io.of('/demo')
        demoNSP.on('connection', (socket) => {
            socket.join('demoRoom', (err) => { if (err) { log('debug', 'err:' + err, ' msg:' + msg, logMeta) } })

            let thisUser = socket.handshake.headers.cookie
            log('debug', 'demo connection event -> ' + thisUser, logMeta)

            socket.on('disctonnect', () => { log('debug', 'demo disconnect event ->' + thisUser, logMeta) })

            socket.on('dclient ready', (data) => {
                let returnStuff = { message: 'Server Ready' }
                return socket.emit('dserver ready', JSON.stringify(returnStuff) + Date())
            })

            socket.on('demoC2S', (msg) => {
                log('debug', 'demoC2S sent ' + msg, logMeta)
                return socket.emit('demoS2C', msg)
            })
        })

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addSocketIOServices }