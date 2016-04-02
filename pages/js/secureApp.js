$(document).ready(function() {
    var myRequest = new Request('/signal/me')
    fetch(myRequest).then((res)=>{return res.json()}).then((response)=>{
        console.log(response)
        let x = JSON.stringify(response)
        $('#signalme').append(document.createTextNode(x))
        console.log(x,'\nResponse:'+response)
    })
})