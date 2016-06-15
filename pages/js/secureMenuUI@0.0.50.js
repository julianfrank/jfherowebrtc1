$('document').ready(function () {
    $('#title').text('JF WebRTC ver' + serverSentVars.appVer)
    $('#thisUser').text(serverSentVars.user.slice(0, -24))
})
