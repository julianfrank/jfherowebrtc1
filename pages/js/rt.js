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

        function whoami() {
            $.ajax({ url: '/whoami', dataType: 'text' })
                .done((me) => {
                    sharedio.emit('c2s', {
                        event: 'userJoin',
                        username: me.slice(1, -1)
                    })
                    log("This User: " + me.slice(1, -1))
                    thisUser = me.slice(1, -1)
                })
        }
        whoami()//RunOnce anyway

        function updateLoggedUserList() {
            //check for list of logged users (Need not be active on socket)
            $.ajax({ url: '/signal/me', dataType: 'text' })
                .done((loggedUsers) => { log('Logged Users are -> ' + loggedUsers) })
        }
        updateLoggedUserList()//RunOnce anyway

    })
})