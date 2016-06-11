'use strict'

let callStarted = false

let wrtcUI = function () {

    $('#title').text('JF WebRTC ver' + serverSentVars.appVer)
    $('#thisUser').text(serverSentVars.user.slice(0, -24))
    listRefresh()

    function listRefresh() {
        return updateListView('#userList', serverSentVars.loggedUserList, thisUser.slice(0, -24))
    }
    //Std Function to Update view based on provided data array
    function updateListView(target, dataArray, filter) {
        $(target).empty()
        dataArray.map((val) => {
            if ((val != filter) && (val.length > 1)) {
                if (callStarted) {
                    $(target).append("<div class = 'w3-btn w3-disabled' id='" + val + "'>" + val + "</div>")
                } else {
                    $(target).append("<div class = 'w3-btn w3-hover-indigo' id='" + val + "'>" + val + "</div>")
                }

            }
        })
    }

    //Select Target to send message
    $('#userList')
        .click((event) => {
            targetEmailID = event.target.id + '@jfkalab.onmicrosoft.com'
            setTarget(targetEmailID)
            $('#button').click((ev) => {
                callStarted = true
                listRefresh()
                wrtcApp().call(true)
            })
        })

    function setTarget(email) {
        $('#targetUser').text(email.slice(0, -24))
        signallingChannel.setTarget(email)
        $('#button')
            .removeClass('w3-disabled')
            .addClass('w3-light-green w3-hover-green w3-padding')
            .text('Connect')
    }

    return { updateListView }
}
$('document')//Call init when document is ready
    .ready(wrtcUI)