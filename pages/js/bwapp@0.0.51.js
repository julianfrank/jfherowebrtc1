$('document').ready()

let bwApp = {
    phone: null,
    init: function (localUser) {
        return new Promise(function (resolve, reject) {
            bwApp.phone = BWClient.createPhone({
                username: localUser,
                domain: 'lab4jf.bwapp.bwsip.io',
                password: 'P@SSw0rd',
                logLevel: 'warn'//can be debug,log,warn,error (default=log)
            })
            bwApp.phone.register()
            bwApp.phone.on('incomingCall', bwApp.incomingHandler)
            BWClient.getUserMedia()
                .then(function (stream) {
                    document.getElementById('selfView').srcObject = stream
                    resolve()
                })
                .catch(function (err) {
                    reject(err)
                })
        })
    },
    incomingHandler: function (bwCall) {
        console.log('Incoming Call')
        //get into to determine if the call should be accepted/rejected
        var info = bwCall.getInfo()

        //user friendly remote identifier
        var remoteId = info.remoteId

        //setup event handlers
        bwCall.on("connected", function () {
            console.log('Call Connected')
            bwCall.setRemoteAudioElement(document.getElementById('remoteView'))
        })
        //to accept the call
        bwCall.accept()

        //to reject the call
        //bwCall.reject()
    },
    liveCall: null,
    callSIP: function (remoteSIPUser) {
        console.log('going to call -> ' + remoteSIPUser + '@lab4jf.bwapp.bwsip.io')
        bwApp.liveCall = bwApp.phone.call(remoteSIPUser)// + '@lab4jf.bwapp.bwsip.io')
        bwApp.liveCall.on('connected', function () {
            bwApp.liveCall.setRemoteAudioElement(document.getElementById('remoteView'))
            console.log('Call connected')
        })
    },
    callE164: function (e164) {
        console.log('going to call -> ' + e164)
        bwApp.liveCall = bwApp.phone.call(e164)// + '@lab4jf.bwapp.bwsip.io')
        bwApp.liveCall.on('connected', function () {
            bwApp.liveCall.setRemoteAudioElement(document.getElementById('remoteView'))
            console.log('Call connected')
        })
    }
}
/*        var bwCall = bwPhone.call("9372650725")
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
        //bwCall.mute()

        //unmute call
        //bwCall.unmute()

        //to hangup the call
        //bwCall.hangup()*/