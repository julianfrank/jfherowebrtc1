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

        whoami(userJoinAnnouce)//Retreive the 
        getLoggedUserList(updateLoggedUserListView)
        getSocketIDList(updateSocketIDListView)
    })

    //Get which emailid associated with this session. Unsecured connect will return 'Guest'
    function whoami(next) { $.ajax({ url: '/whoami', dataType: 'text' }).done(next) }
    function userJoinAnnouce(data) {
        log('/whoami -> ' + data)
        thisUser = (JSON.parse(data).user === 'Guest') ? JSON.parse(data).user : JSON.parse(data).user.slice(1, -1)
        sharedio.emit('c2s', {
            event: 'userJoin',
            username: thisUser
        })
        $('#o_appVer').append(JSON.parse(data).appVer)
        $('#o_thisUser').append(thisUser)
    }

    //check for list of logged users (Need not be active on socket)
    function getLoggedUserList(next) { $.ajax({ url: '/signal/me', dataType: 'text' }).done(next) }
    function updateLoggedUserListView(loggedUsers) {
        $('#o_LoggedUserList').empty()
        log('Logged Users Array:' + loggedUsers)
        let userArray = loggedUsers.slice(1, -1).split(',')//Convert the string into array
        userArray.map((val) => {
            let cleanStr = val.slice(1, -1)//remove the "" 
            $('#o_LoggedUserList').append('<li>' + cleanStr + '</li>')
            return cleanStr
        })
        log('Number of Logged Users are -> ' + userArray.length)
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