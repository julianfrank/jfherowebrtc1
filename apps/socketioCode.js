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

        //Shared Namespace
        let sharedio = io
            .of('/shared')//Namespace by the name shared
            .on('connection', (socket) => {//Handle Connect event

                log('info', 'connect happened on sharedio', logMeta)
                socket.emit('s2c', "Connect Acknowledged by Server")//Acknowledge Connect

                socket.on('c2s', (msg) => {
                    log('info', 'shared Client says ' + JSON.stringify(msg), logMeta)
                    //socket.emit('s2c', 'shared client says ' + msg + ' using socket')
                    switch (msg.event) {
                        case 'userJoin':
                            log('info', 'Going to update socketid ' + socket.id + ' to ' + msg.username, logMeta)
                            userMan.updateUser(msg.username, 'socketid', socket.id, (status, err) => {
                                if (status) {
                                    socket.emit('s2c', socket.id + " Updated for " + msg.username)
                                } else {
                                    socket.emit('s2c', socket.id + " Could not be updated. Error received->" + err)
                                }
                            })
                            break
                        default:
                            socket.broadcast.emit('s2c', msg)
                            break
                    }
                })

                socket.on('disconnect', () => { sharedio.emit('shared User Disconnected') })
                socket.on('error', (err) => { log('error', 'Error in sharedio Socket Service->' + err, logMeta) })
            })

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addSocketIOServices }