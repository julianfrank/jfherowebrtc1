'use strict'

let callStarted = false, targetEmailID = '', targetSIP = ''

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
    bwApp.init(serverSentVars.user.slice(0, -24)).catch(function (err) {
        console.error('bwApp.init Error => ', err)
        $('body').addClass('w3-disabled')
    })

    function setTarget(email) {
        $('#targetUser').text(email.slice(0, -24))
        $('#callButton')
            .removeClass('w3-disabled')
            .addClass('w3-light-green w3-hover-green w3-padding')
            .text('Connect')
    }

    //Select Target to send message
    $('#userList')
        .click((event) => {
            targetEmailID = event.target.id + '@jfkalab.onmicrosoft.com'
            targetSIP = event.target.id
            setTarget(targetEmailID)
            $('#callButton').click((ev) => {
                callStarted = true
                listRefresh()
                bwApp.callSIP(targetSIP)
            })
        })
}
$('document')//Call init when document is ready
    .ready(bwUI)