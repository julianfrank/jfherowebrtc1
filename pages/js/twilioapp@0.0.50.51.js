function twApp() {
    
    Twilio.Device.setup(serverSentVars.twToken, { debug: true })

    Twilio.Device.ready(function (device) {
        //console.debug('Device Ready -> ', device)
        $('#callButton').removeClass('w3-disabled')
        $('#callButton').addClass('w3-green')
        $('#callButton').click(call)
    })

    Twilio.Device.error(function (error) {
        console.error("Twilio Device Error: ", error)
    })

    Twilio.Device.connect(function (conn) {
        console.debug('Connection Ready -> ', conn)
    })
    Twilio.Device.offline(function () {
        console.debug('Connection Offline ')
    })
    Twilio.Device.cancel(function (conn) {
        console.log(conn.parameters.From); // who canceled the call
        conn.status // => "closed"
    })
    Twilio.Device.incoming(function (conn) {
        console.debug(conn.parameters.From); // who is calling
        conn.status // => "pending"
        conn.accept();
        conn.status // => "connecting"
    })

    function call() {
        var connection = Twilio.Device.connect()
    }
    window.call = call
}
$('document').ready(twApp)