$('document').ready(() => alert('bwapp loaded'))

let bwApp = {
    callOut: function () {
        var bwPhone = BWClient.createPhone({
            username: "user1",
            domain: "lab4jf",
            password: "P@SSw0rd",
            logLevel: "debug"//can be debug,log,warn,error (default=log)
        })

        var bwCall = bwPhone.call("+19372650725")
        bwCall.setRemoteAudioElement(document.getElementById('remoteView'))
        window.bwCall = bwCall

        bwCall.on("connected", function () {
            //the call has connected, and audio is playing
            console.log('Call Connected')
        })

        bwCall.on("ended", function () {
            //the call has ended
            console.log('Call Ended')
        })

        //mute call
        //bwCall.mute();

        //unmute call
        //bwCall.unmute();

        //to hangup the call
        //bwCall.hangup();
    }
}