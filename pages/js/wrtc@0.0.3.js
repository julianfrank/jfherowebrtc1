var signallingChannel, signalHandler
(function () {
    //'use strict'
    // Define "global" variables
    var connectButton, disconnectButton, sendButton, messageInputBox, receivebox
    var localVideo, constraints


    //Get local camera and audio in/out and connect them to localvideo
    var initAV = new Promise(function (resolve, reject) {
        constraints = window.constraints = { audio: false, video: true }

        var getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia)
        getUserMedia(constraints,
            function (stream) {
                var video = document.querySelector('#localVideo')
                var videoTracks = stream.getVideoTracks()
                log('Got stream with constraints:' + constraints + '\nUsing video device: ' + videoTracks[0].label)
                //stream.active = function () { log('Stream Active') };            stream.onended = function () { log(stream); log('Stream ended') }
                window.stream = stream; // make variable available to browser console 
                var url = window.URL || window.webkitURL
                video.src = url ? url.createObjectURL(stream) : stream
                video.onloadedmetadata = function (event) {
                    video.play()
                    resolve()
                }
            },
            function (error) {
                var logtext = error.name + ": " + error.message
                if (error.name === 'ConstraintNotSatisfiedError') {
                    logtext += '\nThe resolution ' + constraints.video.width.exact + 'x' + constraints.video.width.exact + ' px is not supported by your device.'
                } else if (error.name === 'PermissionDeniedError') {
                    logtext += '\nPermissions have not been granted to use your camera and microphone, you need to allow the page access to your devices in order for the demo to work.'
                }
                logtext += '\ngetUserMedia error: ' + error.name + '->' + error
                reject(logtext)
            })
    })

    function connectPeers() {
        var pc_config = { "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] }
        try {
            // Create an RTCPeerConnection via the polyfill (adapter.js).
            pc = new RTCPeerConnection(pc_config)
            pc.onicecandidate = onIceCandidate
            log("Created RTCPeerConnnection with config:\n" + "  \"" + JSON.stringify(pc_config) + "\".")
        } catch (e) {
            log("Failed to create PeerConnection, exception: " + e.message)
            alert("Cannot create RTCPeerConnection object; WebRTC is not supported by this browser.")
            return
        }

        /*pc.onconnecting = onSessionConnecting
        pc.onopen = onSessionOpened
        pc.onaddstream = onRemoteStreamAdded
        pc.onremovestream = onRemoteStreamRemoved*/
    }

    function onIceCandidate(evt) {
        signalingChannel.send(JSON.stringify({ "candidate": evt.candidate }));
    }
    function onRemoteStreamAdded(event) {
        // ...
        //miniVideo.src = localVideo.src
        attachMediaStream(remoteVideo, event.stream);
        remoteStream = event.stream;
        waitForRemoteVideo();
    }

    signallingChannel = function (local, remote, channel, msgHandler) {
        this.localUser = local, this.remoteUser = remote, this.connected = false
        log('Signalling Between ' + this.localUser + ' & ' + this.remoteUser + 'is Ready')
        connectButton.disabled = false
        connectButton.innerText = 'Connect ' + remote.slice(0, -24)

        channel.emit('c2sWRTC', { event: 'wrtcSignalTest', from: this.localUser, to: this.remoteUser })

        channel.on('s2cWRTC', function (msg) {
            if (msg.event = 'wrtcSignalTest') {
                disconnectButton.disabled = false
                disconnectButton.innerText = 'Disconnect ' + msg.from.slice(0, -24)
                if (!this.connected) {
                    this.connected = true
                    channel.emit('c2sWRTC', { event: 'wrtcSignalTest', from: this.localUser, to: this.remoteUser })
                }
            } else {
                msgHandler(msg)
            }
        })

        this.send = function (msg) {
            channel.emit('c2sWRTC', {
                event: 'wrtcSignal',
                from: this.localUser, to: this.remoteUser,
                message: msg
            })
        }
    }

    function signalHandler(msg) {
        log(JSON.stringify(msg))
    }


    // Set things up, connect event listeners, etc.
    function startup() {
        connectButton = document.getElementById('connectButton')
        disconnectButton = document.getElementById('disconnectButton')
        sendButton = document.getElementById('sendButton')
        messageInputBox = document.getElementById('message')
        receiveBox = document.getElementById('receivebox')
        localVideo = document.getElementById('localVideo')
        remoteVideo = document.getElementById('remoteVideo')

        initAV
            .then(() => { log('Init AV Initialized') })
            .catch((err) => { log(err) })
        // Set event listeners for user interface widgets

        //connectButton.addEventListener('click', connectPeers, false)
        //disconnectButton.addEventListener('click', disconnectPeers, false)
        //sendButton.addEventListener('click', sendMessage, false)
    }



    // Set up an event listener which will run the startup
    // function once the page is done loading.

    window.addEventListener('load', startup, false)
})();