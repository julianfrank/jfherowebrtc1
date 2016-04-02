$(document).ready(function() {
    var myRequest = new Request('/signal/me')
    fetch(myRequest).then((response)=>{
        console.log(response.body)
        let x = response
        $('#signalme').append(document.createTextNode(x))
        console.log(x,'\nResponse:'+response)
    })
})