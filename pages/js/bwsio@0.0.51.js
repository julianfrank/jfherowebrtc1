'use strict'

let thisUser = serverSentVars.user || 'Guest'

$(document).ready(() => {
    let sharedio = io('/shared')  //open Connected on shared namespace
    sharedio.on('connect', () => {//Check for connect
        sharedio.on('disconnect', () => { console.log('sharedio.disconnect event fired') })
        sharedio.emit('c2s', { event: 'userJoin', username: thisUser })

        sharedio.on('s2c', function (msg) {
            let cleanmsg = JSON.parse(String(JSON.stringify(msg)))
            switch (cleanmsg.event) {
                case 'dirUpdated':
                    listRefresh()
                    break
                case 'ready':
                    listRefresh(msg.newDir)
                    break
                default:
                    console.log('s2c got unhandled message->', cleanmsg)
                    break
            }
        })
    })
})