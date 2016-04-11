'use strict'

const helpers = require('../apps/helpers')
const log = helpers.log
const util = require('util')

let addSocketIOServices = (processObjects) => {
    log('socketioCode.js\t:Adding SocketIO Services')
    return new Promise((resolve, reject) => {

        let app = processObjects.app
        processObjects.socketIO = require('socket.io')(
            require('http').Server(app)
        )
        let io = processObjects.socketIO

        var rHost = 'pub-redis-14190.us-central1-1-1.gce.garantiadata.com'
        var rPort = 14190
        var rAuth = 'redisPASS'

        var redis = processObjects.redis.createClient
        var pub = redis(rPort, rHost, { auth_pass: rAuth })
        var sub = redis(rPort, rHost, { return_buffers: true, auth_pass: rAuth })

        var sirAdapter = require('socket.io-redis')({ pubClient: pub, subClient: sub })

        io.adapter(sirAdapter)
        sirAdapter.pubClient.on('error', function() { })
        sirAdapter.subClient.on('error', function() { })

        process.nextTick(() => resolve(processObjects))
    })
}
module.exports = { addSocketIOServices }