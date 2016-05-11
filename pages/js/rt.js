$(document).ready( ()=> {

    var socket = io('/test',{transports:['polling','websocket']});
    socket.emit('client ready', 'Client is Ready')
    socket.on('server ready', function (data) { log("soicketIO server says -> "+data) })

    $.ajax({
        url: '/signal/me',
        dataType: 'text'
    }).done((data) => {
        log("ajax signalme response: "+data)
    })

    var socketDemo = io('/demo');
    socketDemo.emit('dclient ready', 'Client is Ready')
    socketDemo.on('dserver ready', function (data) { log("dserver says->"+data) })

    $("#i_chat").keyup(() => { socketDemo.emit('demoC2S', $('#i_chat').val()) })
    socketDemo.on('demoS2C', function (data) { log("demoS2C says -> "+data) })

})