$(document).ready( ()=> {

    var socket = io('/test',{transports:['websocket']});
    socket.emit('client ready', 'Client is Ready')
    socket.on('server ready', function (data) { $('#sio').text(data) })

    $.ajax({
        url: '/signal/me',
        dataType: 'text'
    }).done((data) => {
        $('#signalme').text(data)
    })

    var socketDemo = io('/demo');
    socketDemo.emit('dclient ready', 'Client is Ready')
    socketDemo.on('dserver ready', function (data) { $('#o_chat').text(data) })

    $("#i_chat").keyup(() => { socketDemo.emit('demoC2S', $('#i_chat').val()) })
    socketDemo.on('demoS2C', function (data) { $('#o_chat').text(data) })

})