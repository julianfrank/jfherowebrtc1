$(document).ready(function () {

    var socket = io('/test');
    socket.emit('client ready', 'Client is Ready')
    socket.on('server ready', function (data) {
        $('#sio').text(data)
    })

    var myRequest = new Request('/signal/me')
    fetch(myRequest).then((res) => { return res.text() }).then((response) => {
        //console.log(response)
        let x = response
        $('#signalme').append(document.createTextNode(x))
        //console.log(x, '\nResponse:' + response)
    })

    var socketDemo = io('/demo');
    socketDemo.join('demoRoom')
    socketDemo.emit('dclient ready', 'Client is Ready')
    socketDemo.on('dserver ready', function (data) { $('#o_chat').text(data) })

    $("#i_chat").keyup(() => { socketDemo.emit('demoC2S', $('#i_chat').val()) })
    socketDemo.on('demoS2C', function (data) { $('#o_chat').text(data) })

})