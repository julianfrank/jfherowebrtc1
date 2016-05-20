$(document).ready(() => {

    let thisUser = serverSentVars.user || 'Guest',
        thisSocketID = null,
        targetSocketID = ''

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
                    log('Ready -> Socket ID:' + thisSocketID + ' User ID:' + thisUser)
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

                default:
                    log("Unhandled message: sio says -> " + JSON.stringify(msg))
                    break
            }
        })

        //Update Logged SocketID View - [TODO] Remove later
        $.ajax({ url: '/socketID/all', dataType: 'json' }).then((data) => { updateListView('#o_LoggedSocketIDList', data) })

        $('#o_LoggedUserList').click((event) => {
            log('Going to send via c2s->' + "{ event: 'socketID4email', email: '" + event.target.id + "@jfkalab.onmicrosoft.com' })")
            sharedio.emit('c2s', { event: 'socketID4email', email: event.target.id + '@jfkalab.onmicrosoft.com' })
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
    function sendDirectChatMsg() {
        sharedio.emit('c2s', {
            event: 'directChatMsg',
            from: thisUser,
            to: targetSocketID,
            message: $('#i_directChat').val()
        })
        log('Group sharedio.emit->' + $('#i_directChat').val() + ' to ' + targetSocketID)
    }
})