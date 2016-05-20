$(document).ready(() => {

    let thisUser = serverSentVars.user || 'Guest',
        thisSocketID = null


    $('#o_appVer').text(serverSentVars.appVer)
    $('#o_thisUser').text(serverSentVars.user)
    $('#o_LoggedUserList').empty()
    updateListView('#o_LoggedUserList', serverSentVars.loggedUserList, thisUser.slice(0, -24))

    function updateListView(target, userList, filter) {
        userList.map((val) => {
            //log(val+'--'+filter)
            if (val != filter) {
                $(target).append('<li>' + val + '</li>')
            }
        })
    }
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
                default:
                    log("Unhandled message: sio says -> " + JSON.stringify(msg))
                    break
            }
        })

        //whoami.then(userJoinAnnouce)
        //getLoggedUserList.then(updateLoggedUserListView)
        getSocketIDList(updateSocketIDListView)
    })

    //check for list of logged SocketIDs
    function getSocketIDList(next) { $.ajax({ url: '/socketID/all', dataType: 'json' }).done(next) }
    function updateSocketIDListView(SocketIDList) {
        $('#o_LoggedSocketIDList').empty()
        let SocketIDArray = SocketIDList//.slice(1, -1).split(',')//Convert the string into array
        SocketIDArray.map((val) => {
            let cleanStr = val.slice(1, -1)//remove the "" 
            $('#o_LoggedSocketIDList').append('<li>' + val + '</li>')
            return cleanStr
        })
        log('Logged SocketID Array:' + SocketIDArray)
    }

    //handle any entry in the chat box...send it to server
    $("#b_Send").click(sendChatMsg)
    $('#i_chat').change(sendChatMsg)
    function sendChatMsg() {
        sharedio.emit('c2s', {
            event: 'groupChatMsg',
            from: thisUser,
            message: $('#i_chat').val()
        })
        log('sharedio.emit->' + $('#i_chat').val())
    }
})