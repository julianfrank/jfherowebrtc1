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

                socket.on('c2sWRTC', (msg) => {
                    userMan.getValueFromemail(msg.to, 'SocketID')
                        .then((socketID) => {
                            socket.to(socketID).emit('s2cWRTC', msg)
                            log('debug', 's2cWRTC-> ' + JSON.stringify(msg), logMeta)
                        })
                        .catch((err) => {
                            log('error', 's2cWRTC->Error in socketID4email -> ' + err, logMeta)
                        })
                })

                let sendReady = (user) => {
                    userMan.getLoggedUsers()
                        .then((newDir) => {
                            socket.broadcast.emit('s2c', {
                                event: 'ready',
                                socketID: socket.id,
                                userID: user,
                                newDir: newDir
                            })
                        })
                }
                let sendDirUpdate = () => {
                    userMan.getLoggedUsers()
                        .then((newDir) => {
                            socket.broadcast.emit('s2c', {
                                event: 'dirUpdated',
                                newDir: newDir
                            })
                        })
                }
                socket.on('disconnect', () => {
                    log('info', socket.id + ' has Disconnected', logMeta)
                    log('info', 'Going to remove socketid ' + socket.id, logMeta)
                    userMan.removeSocket(socket.id, (status, err) => {
                        if (status) {
                            socket.emit('s2c', log('info', socket.id + ' Removed', logMeta))
                        } else {
                            socket.emit('s2c', log('error', socket.id + ' Remove Failed with error -> ' + err, logMeta))
                        }
                    })
                    sendDirUpdate()
                })
                socket.on('error', (err) => { log('error', socket.id + '\t:Error in sharedio Socket Service->' + err, logMeta) })

                socket.on('c2s', (msg) => {
                    log('info', 'shared Client says ' + JSON.stringify(msg), logMeta)
                    switch (msg.event) {

                        case 'userJoin':
                            log('info', 'Going to update username ' + msg.username + ' to ' + socket.id, logMeta)
                            userMan.addSocket(socket.id, msg.username, (status, err) => {
                                if (status) {
                                    //socket.emit('s2c', { event: 'socketCacheSuccess', socketID: socket.id, user: msg.username })
                                } else {
                                    socket.emit('s2c', { event: 'socketCacheFail', socketID: socket.id, error: err })
                                }
                            })
                            sendReady(msg.username)
                            break

                        case 'groupChatMsg':
                            socket.broadcast.emit('s2c', msg)
                            break

                        case 'directChatMsg':
                            socket.to(msg.to).emit('s2c', msg)
                            break

                        case 'socketID4email':
                            userMan.getValueFromemail(msg.email, 'SocketID')
                                .then((socketID) => {
                                    //log('info', 'Going to send response for socketID4email ->' + inspect(socketID), logMeta)
                                    socket.emit('s2c', {
                                        event: 'socketID4email',
                                        email: msg.email,
                                        socketID: socketID
                                    })
                                })
                                .catch((err) => {
                                    log('error', 'Error in socketID4email -> ' + err, logMeta)
                                })
                            break

                        case 'msgToEmail':
                            userMan.getValueFromemail(msg.toEmail, 'SocketID')
                                .then((socketID) => {
                                    socket.to(socketID).emit('s2c', msg)
                                })
                                .catch((err) => {
                                    log('error', 'Error in socketID4email -> ' + err, logMeta)
                                })
                            break

                        default:
                            socket.broadcast.emit('s2c', msg)
                            break

                    }
                })

            })

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addSocketIOServices }

