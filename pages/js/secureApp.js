$(document).ready(function() {
    var myRequest = new Request('/signal/me')
    fetch(myRequest).then((res) => { return res.text() }).then((response) => {
        console.log(response)
        //let x = JSON.stringify(response)
        let x = response
        $('#signalme').append(document.createTextNode(x))
        console.log(x, '\nResponse:' + response)
    })

    var sio = io.connect()
    sio.emit('ready')

})