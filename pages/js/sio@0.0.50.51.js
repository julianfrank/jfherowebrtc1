'use strict'

let thisUser = serverSentVars.user || 'Guest', targetEmailID = ''

var signallingChannel = {
    localUser: null,
    remoteUser: 'Guest',
    channel: null,
    signalHandler: null,
    init: function (local, channel) {
        signallingChannel.localUser = local
        signallingChannel.channel = channel
        signallingChannel.channel.on('s2cWRTC', function (msg) {
            let cleanmsg = JSON.parse(String(JSON.stringify(msg)))
            switch (cleanmsg.event) {
                case 'wrtcSignal':
                    //console.log('going to handle signal->' + JSON.stringify(cleanmsg))
                    signallingChannel.signalHandler(cleanmsg)
                    break;
                default:
                    console.log('s2cRTC got unhandled message->' + cleanmsg)
                    break
            }
        })
    },
    setHandler: function (handler) {
        signallingChannel.signalHandler = handler
    },
    setTarget: function (target) {
        signallingChannel.remoteUser = target
    },
    send: function (msg) {
        signallingChannel.channel.emit('c2sWRTC', {
            event: 'wrtcSignal',
            from: signallingChannel.localUser, to: signallingChannel.remoteUser,
            message: msg
        })
    }
}

$(document).ready(() => {
    let sharedio = io('/shared')  //open Connected on shared namespace
    sharedio.on('connect', () => {//Check for connect
        sharedio.on('disconnect', () => { console.log('sharedio.disconnect event fired') })
        sharedio.emit('c2s', { event: 'userJoin', username: thisUser })
        //Initiate signalling for webrtc
        signallingChannel.init(thisUser, sharedio)
        signallingChannel.setHandler(wrtcApp().sigHandlerExport())
    })
})