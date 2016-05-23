var signallingChannel, signalHandler, pc
(function () {
    //'use strict'
    // Define "global" variables
    var connectButton, disconnectButton, sendButton, messageInputBox, receivebox, localVideo
    var getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mediaDevices.getUserMedia || navigator.msGetUserMedia)
    var constraints = window.constraints = { audio: false, video: true }
    var pc_config = {}// "iceServers": [{ "urls": "stun:stun.l.google.com:19302" }] }

    //Get local camera and audio in/out and connect them to localvideo
    var initAV = function () {
        return new Promise(function (resolve, reject) {
            getUserMedia(constraints,
                function (stream) {
                    var video = document.querySelector('#localVideo')
                    //stream.active = function () { log('Stream Active') };            stream.onended = function () { log(stream); log('Stream ended') }
                    window.stream = stream; // make variable available to browser console 
                    var url = window.URL || window.webkitURL
                    video.src = url ? url.createObjectURL(stream) : stream
                    video.onloadedmetadata = function (event) {
                        video.play()
                        resolve(stream)
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
    }

    var connectPeers = function () {
        return new Promise(function (resolve, reject) {
            try {
                // Create an RTCPeerConnection via the polyfill (adapter.js).
                log('ConnectPeer Entered')
                pc = new RTCPeerConnection(pc_config)
                pc.onicecandidate = function (evt) {
                    signallingChannel.send(JSON.stringify({ "candidate": evt.candidate }));
                }
                log("Created RTCPeerConnnection with config:\t" + JSON.stringify(pc_config))
            } catch (e) {
                reject("Failed to create PeerConnection, exception: " + e.message)
                alert("Cannot create RTCPeerConnection object; WebRTC is not supported by this browser.")
                return
            }

            try {
                pc.ontrack = function (evt) {
                    remoteView.src = URL.createObjectURL(evt.stream);
                }
            } catch (error) {
                reject('Error in pc.ontrack -> ' + error)
            }
            /*pc.onconnecting = onSessionConnecting
            pc.onopen = onSessionOpened
            pc.onremovestream = onRemoteStreamRemoved*/
            resolve()
        })
    }

    function onRemoteStreamAdded(event) {
        // ...
        //miniVideo.src = localVideo.src
        attachMediaStream(remoteVideo, event.stream);
        remoteStream = event.stream;
        waitForRemoteVideo();
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

        // Set event listeners for user interface widgets
        connectButton.addEventListener('click', initConnect, false)
        //disconnectButton.addEventListener('click', disconnectPeers, false)
        //sendButton.addEventListener('click', sendMessage, false)
    }

    var initConnect = function () {
        connectPeers()
            .then(initAV)
            .then((stream) => {
                log('Init AV Initialized')
                var videoTracks = stream.getVideoTracks()
                log('Using video device: ' + videoTracks[0].label)
            })
            .catch((err) => { log(err) })
    }

    // Set up an event listener which will run the startup
    // function once the page is done loading.

    window.addEventListener('load', startup, false)
})();