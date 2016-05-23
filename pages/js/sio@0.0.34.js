$(document).ready(() => {

    let thisUser = serverSentVars.user || 'Guest',
        thisSocketID = null,
        targetSocketID = '',
        targetEmailID = ''

    $('#o_appVer').text(serverSentVars.appVer)
    $('#o_thisUser').text(serverSentVars.user)
    $('#o_LoggedUserList').empty()
    updateListView('#o_LoggedUserList', serverSentVars.loggedUserList, thisUser.slice(0, -24))

    let sharedio = io('/shared')  //open Connected on shared namespace
    sharedio.on('connect', () => {//Check for connect
        sharedio.on('disconnect', () => { log('sharedio.disconnect event fired') })

        sharedio.emit('c2s', { event: 'userJoin', username: thisUser })

        //log any data received from server
        sharedio.on('s2c', (msg) => {

            switch (msg.event) {

                case 'ready':
                    thisSocketID = msg.socketID
                    if (thisUser != msg.userID) { log('Something wrong - UserID mispatch - thisUser:' + thisUser + ' msg.userID:' + msg.userID) }
                    $('#o_thisUserSoID').append(thisSocketID)
                    //log('Ready -> Socket ID:' + thisSocketID + ' User ID:' + thisUser)
                    break

                case 'dirUpdated':
                    updateListView('#o_LoggedUserList', msg.newDir, thisUser.slice(0, -24))
                    break

                case 'groupChatMsg':
                    log('Event:' + msg.event + '\t' + msg.from + ' says ' + msg.message)
                    $('#o_Groupchat').append('<br><span>' + msg.from + ':\t' + msg.message + '</span>')
                    break

                case 'directChatMsg':
                    log('Event:' + msg.event + '\t' + msg.from + ' says ' + msg.message)
                    $('#o_personalChat').append('<br><span>' + msg.from + ':\t' + msg.message + '</span>')
                    break

                case 'socketID4email':
                    log('socketID4email Returned SocketID:' + msg.socketID)
                    $('#o_targetUser').text(msg.email + ' -> ' + msg.socketID)
                    targetSocketID = msg.socketID
                    break

                case 'msgToEmail':
                    $('#o_personalChat').append('<br><span>' + msg.from + ':\t' + msg.message + '</span>')
                    break

                default:
                    log("Unhandled message: sio says -> " + JSON.stringify(msg))
                    break
            }
        })
    })

    //Std Function to Update view based on provided data array
    function updateListView(target, dataArray, filter) {
        $(target).empty()
        dataArray.map((val) => {
            //log(val+'--'+filter)
            if ((val != filter) && (val != null)) {
                $(target).append("<li id='" + val + "'>" + val + "</li>")
            }
        })
    }

    //handle any entry in the Group chat box...send it to server
    $("#b_Send").click(sendGroupChatMsg)
    $('#i_GroupChat').change(sendGroupChatMsg)
    function sendGroupChatMsg() {
        sharedio.emit('c2s', {
            event: 'groupChatMsg',
            from: thisUser,
            message: $('#i_GroupChat').val()
        })
        log('Group sharedio.emit->' + $('#i_GroupChat').val())
    }

    //handle any entry in the direct chat box...send it to server
    $("#b_directSend").click(sendDirectChatMsg)
    $('#i_directChat').change(sendDirectChatMsg)
    function sendDirectChatMsg() { sendMessageToEmail(targetEmailID, $('#i_directChat').val()) }
    //Shared function to send message to emailid...Email has to be full email id
    function sendMessageToEmail(emailID, message) {
        log('Sending ->' + message + ' to ' + emailID)
        sharedio.emit('c2s', {
            event: 'msgToEmail',
            from: thisUser,
            toEmail: emailID,
            message: message
        })
    }

    //Select Target to send message
    $('#o_LoggedUserList')
        .click((event) => {
            //log('Going to send via c2s->' + "{ event: 'socketID4email', email: '" + event.target.id + "@jfkalab.onmicrosoft.com' })")
            targetEmailID = event.target.id + '@jfkalab.onmicrosoft.com'
            $('#o_targetUser').text(targetEmailID)
            signallingChannel(thisUser, targetEmailID, sharedio, signalHandler)//Initiate signalling for webrtc
        })

    signalHandler = function (msg) {
        log('Signal Handler got a message ->' + JSON.stringify(msg))
    }

    signallingChannel = function (local, remote, channel, msgHandler) {
        this.localUser = local, this.remoteUser = remote, this.connected = false
        log('Signalling Between ' + this.localUser + ' & ' + this.remoteUser + 'is Ready')
        connectButton.disabled = false
        connectButton.innerText = 'Connect ' + remote.slice(0, -24)

        channel.emit('c2sWRTC', { event: 'wrtcSignalTest', from: this.localUser, to: this.remoteUser })

        channel.on('s2cWRTC', function (msg) {
            if (msg.event = 'wrtcSignalTest') {
                disconnectButton.disabled = false
                disconnectButton.innerText = 'Disconnect ' + msg.from.slice(0, -24)
                if (!this.connected) {
                    this.connected = true
                    channel.emit('c2sWRTC', { event: 'wrtcSignalTest', from: this.localUser, to: this.remoteUser })
                }
            } else {
                msgHandler(msg)
            }
        })

        this.send = function (msg) {
            channel.emit('c2sWRTC', {
                event: 'wrtcSignal',
                from: this.localUser, to: this.remoteUser,
                message: msg
            })
        }
    }
})