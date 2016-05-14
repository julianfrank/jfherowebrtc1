$(document).ready(() => {

    let thisUser = 'Guest'
    let sharedio = io('/shared')  //open Connected on shared namespace
    sharedio.on('connect', () => {//Check for connect
        //sharedio.emit('c2s', 'sio.connect event')//send message back to server on connect
        log('shared.connect event fired')

        //handle any entry in the chat box...send it to server
        $("#i_chat")
            .keyup(() => {
                sharedio.emit('c2s', {
                    event: 'chatMsg',
                    sendingUser: thisUser,
                    message: $('#i_chat').val()
                })
                log('sharedio.emit->' + $('#i_chat').val())
            })

        //log any data received from server
        sharedio.on('s2c', (msg) => {
            switch (msg.event) {
                case 'userJoin':
                    log('Event:' + msg.event + '\tUserName:' + msg.username)
                    break
                case 'chatMsg':
                    log('Event:' + msg.event + '\t' + msg.sendingUser + ' says ' + msg.message)
                    break
                default:
                    log("sio says -> " + JSON.stringify(msg))
                    break
            }
        })

        //Get which emailid associated with this session. Unsecured connect will return 'Guest'
        function whoami(next) { $.ajax({ url: '/whoami', dataType: 'text' }).done(next) }
        function userJoinAnnouce(me) {
            sharedio.emit('c2s', {
                event: 'userJoin',
                username: (me === 'Guest') ? me : me.slice(1, -1)
            })
            log("This User: " + me)
            thisUser = (me === 'Guest') ? me : me.slice(1, -1)
        }
        whoami(userJoinAnnouce)//RunOnce anyway

        //check for list of logged users (Need not be active on socket)
        function getLoggedUserList(next) { $.ajax({ url: '/signal/me', dataType: 'text' }).done(next) }
        function updateLoggedUserListView(loggedUsers) {
            log(loggedUsers)
            let userArray = loggedUsers.slice(1, -1).split(',')//Convert the string into array
            userArray.map((val) => {
                let cleanStr = val.slice(1, -1)//remove the "" 
                $('#o_LoggedUserList').append('<li>' + cleanStr + '</li>')
                return cleanStr
            })
            log('Logged Users are -> ' + userArray.length)
        }
        getLoggedUserList(updateLoggedUserListView)//RunOnce anyway

    })
})