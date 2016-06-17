'use strict'

let callStarted = false

function listRefresh(loggedUserList) {
    return updateListView('#userList', loggedUserList || serverSentVars.loggedUserList, thisUser.slice(0, -24))
}
//Std Function to Update view based on provided data array
function updateListView(target, dataArray, filter) {
    $(target).empty()
    dataArray.map((val) => {
        if ((val != filter) && (val.length > 1)) {
            if (callStarted) {
                $(target).append("<div class = 'w3-tag w3-disabled' id='" + val + "'>" + val + "</div>")
            } else {
                $(target).append("<div class = 'w3-tag w3-hover-indigo' id='" + val + "'>" + val + "</div>")
            }

        }
    })
}

let bwUI = function () {

    $('#title').text('JF Bandwidth Demo ver' + serverSentVars.appVer)
    $('#thisUser').text(serverSentVars.user.slice(0, -24))
    listRefresh()

    //Select Target to send message
    $('#userList')
        .click((event) => {
            targetEmailID = event.target.id + '@jfkalab.onmicrosoft.com'
            setTarget(targetEmailID)
            $('#button').click((ev) => {
                callStarted = true
                listRefresh()
                wrtcApp().call({ type: 'newCall' })
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
    .ready(bwUI)