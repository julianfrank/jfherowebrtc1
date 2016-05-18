$(document).ready(() => {

    let thisUser = 'Guest', thisSocketID = null, thisSessionID = null

    let sharedio = io('/shared')  //open Connected on shared namespace
    sharedio.on('connect', () => {//Check for connect
        sharedio.on('disconnect', () => { log('sharedio.disconnect event fired') })

        //log any data received from server
        sharedio.on('s2c', (msg) => {
            //log(JSON.stringify(msg)+'\t'+msg.event)
            switch (msg.event) {
                case 'ready':
                    thisSocketID = msg.socketID
                    thisUser = msg.userID
                    //thisSessionID = msg.sessionID//log('Ready -> Socket ID:' + thisSocketID + ' Session ID:' + thisSessionID + ' User ID:' + thisUser)
                    log('Ready -> Socket ID:' + thisSocketID + ' User ID:' + thisUser)
                    break
                case 'chatMsg':
                    log('Event:' + msg.event + '\t' + msg.from + ' says ' + msg.message)
                    $('#o_chat').append('<li>' + msg.from + ':\t' + msg.message + '</li>')
                    break
                default:
                    log("unhandled message: sio says -> " + JSON.stringify(msg))
                    break
            }
        })

        whoami.then(userJoinAnnouce)
        getLoggedUserList.then(updateLoggedUserListView)
        getSocketIDList(updateSocketIDListView)
    })

    //Get which emailid associated with this session. Unsecured connect will return 'Guest'
    let whoami = $.ajax({ url: '/whoami', dataType: 'text' })
    let userJoinAnnouce = (data, textStatus, jqXHR) => {
        return new Promise((resolve, reject) => {
            log('/whoami -> ' + data)
            thisUser = (JSON.parse(data).user === 'Guest') ? JSON.parse(data).user : JSON.parse(data).user
            sharedio.emit('c2s', { event: 'userJoin', username: thisUser })
            $('#o_appVer').append(JSON.parse(data).appVer)
            $('#o_thisUser').append(thisUser)
            return resolve
        })
    }

    //check for list of logged users (Need not be active on socket)
    let getLoggedUserList = $.ajax({ url: '/signal/me', dataType: 'text' })
    let updateLoggedUserListView = (data, textStatus, jqXHR) => {
        return new Promise((resolve, reject) => {
            let loggedListStr = data.slice(1, -1).split(',')
            log('Logged Users Array:' + loggedListStr)
            $('#o_LoggedUserList').empty()
            loggedListStr.map((val) => {
                if (thisUser.slice(0, -24) != val.slice(1, -1)) {
                    $('#o_LoggedUserList').append('<li>' + val.slice(1, -1) + '</li>')
                }
            })
            return resolve
        })
    }


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
    $("#b_Send")
        .click(() => {
            sharedio.emit('c2s', {
                event: 'chatMsg',
                from: thisUser,
                message: $('#i_chat').val()
            })
            log('sharedio.emit->' + $('#i_chat').val())
        })
})