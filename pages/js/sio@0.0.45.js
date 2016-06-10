'use strict'

let thisUser = serverSentVars.user || 'Guest',
    thisSocketID = null,
    targetSocketID = '',
    targetEmailID = '',
    iAmCaller = false

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
                case 'req':
                    signallingChannel.remoteUser = cleanmsg.from
                    //disconnectButton..disabled = false
                    //disconnectButton..innerText = 'Disconnect ' + signallingChannel.remoteUser.slice(0, -24)
                    var ack = { event: 'ack', from: signallingChannel.localUser, to: signallingChannel.remoteUser }
                    debugstr = ack
                    signallingChannel.emit('c2sWRTC', ack)
                    break
                case 'ack':
                    console.log('Acknowledgement received from ' + cleanmsg.from)
                    signallingChannel.remoteUser = cleanmsg.from
                    //disconnectButton..disabled = false
                    //disconnectButton..innerText = 'Disconnect ' + signallingChannel.remoteUser.slice(0, -24)
                    break
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
        //connectButton..disabled = false
        //connectButton..innerText = 'Connect ' + signallingChannel.remoteUser.slice(0, -24)
    },
    connect: function () {
        //connectButton..disabled = true
        //disconnectButton..disabled = false
        var req = { event: 'req', to: signallingChannel.remoteUser, from: signallingChannel.localUser }
        signallingChannel.channel.emit('c2sWRTC', req)
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

        //log any data received from server
        sharedio.on('s2c', (msg) => {

            switch (msg.event) {

                case 'ready':
                    thisSocketID = msg.socketID
                    if (thisUser != msg.userID) { console.log('Something wrong - UserID mispatch - thisUser:' + thisUser + ' msg.userID:' + msg.userID) }
                    $('#o_thisUserSoID').append(thisSocketID)
                    //console.log('Ready -> Socket ID:' + thisSocketID + ' User ID:' + thisUser)
                    break

                case 'dirUpdated':
                    wrtcUI().updateListView('#o_LoggedUserList', msg.newDir, thisUser.slice(0, -24))
                    break

                case 'groupChatMsg':
                    console.log('Event:' + msg.event + '\t' + msg.from + ' says ' + msg.message)
                    $('#o_Groupchat').append('<br><span>' + msg.from + ':\t' + msg.message + '</span>')
                    break

                case 'directChatMsg':
                    console.log('Event:' + msg.event + '\t' + msg.from + ' says ' + msg.message)
                    $('#o_personalChat').append('<br><span>' + msg.from + ':\t' + msg.message + '</span>')
                    break

                case 'socketID4email':
                    console.log('socketID4email Returned SocketID:' + msg.socketID)
                    $('#o_targetUser').text(msg.email + ' -> ' + msg.socketID)
                    targetSocketID = msg.socketID
                    break

                case 'socketCacheSuccess':
                    console.log('Socket details for ' + msg.user + ' updated as ' + msg.socketID)
                    break

                case 'msgToEmail':
                    $('#o_personalChat').append('<br><span>' + msg.from + ':\t' + msg.message + '</span>')
                    break

                default:
                    console.log("Unhandled message: sio says -> " + JSON.stringify(msg))
                    break
            }
        })
    })

    //handle any entry in the Group chat box...send it to server
    $("#b_Send").click(sendGroupChatMsg)
    $('#i_GroupChat').change(sendGroupChatMsg)
    function sendGroupChatMsg() {
        sharedio.emit('c2s', {
            event: 'groupChatMsg',
            from: thisUser,
            message: $('#i_GroupChat').val()
        })
        console.log('Group sharedio.emit->' + $('#i_GroupChat').val())
    }

    //handle any entry in the direct chat box...send it to server
    $("#b_directSend").click(sendDirectChatMsg)
    $('#i_directChat').change(sendDirectChatMsg)
    function sendDirectChatMsg() { sendMessageToEmail(targetEmailID, $('#i_directChat').val()) }
    //Shared function to send message to emailid...Email has to be full email id
    function sendMessageToEmail(emailID, message) {
        console.log('Sending ->' + message + ' to ' + emailID)
        sharedio.emit('c2s', {
            event: 'msgToEmail',
            from: thisUser,
            toEmail: emailID,
            message: message
        })
    }
})