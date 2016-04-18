$(document).ready(function () {

    var socket = io();
    socket.emit('client ready', 'Client is Ready')
    socket.on('server ready', function (data) {
        $('#sio').text(data)
    });

    var myRequest = new Request('/signal/me')
    fetch(myRequest).then((res) => { return res.text() }).then((response) => {
        //console.log(response)
        let x = response
        $('#signalme').append(document.createTextNode(x))
        //console.log(x, '\nResponse:' + response)
    })

})