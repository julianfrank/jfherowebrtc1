$(document).ready(() => {

    $.ajax({ url: '/signal/me', dataType: 'text' })
        .done((data) => { log("ajax signalme response: " + data) })

    var shared = io('/shared')

    shared.on('connect', () => {
        shared.emit('message', 'sio.connect event')
        log('shared.connect event fired')
    })

    $("#i_chat").keyup(() => {
        shared.emit('message', $('#i_chat').val())
        log('shared.emit event fired with msg ' + $('#i_chat').val())
    })

    shared.on('s2c',(data) => { log("sio says -> " + data) })

})