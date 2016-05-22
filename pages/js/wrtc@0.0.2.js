(function () {
    //'use strict'
    // Define "global" variables
    var connectButton, disconnectButton, sendButton, messageInputBox, receivebox
    var localVideo


    function initAV() {
        // Prefer camera resolution nearest to 1280x720.
        var constraints = window.constraints = { audio: false, video: true }

        navigator.getUserMedia(constraints,
            function (stream) {
                var video = document.querySelector('#localVideo')
                var videoTracks = stream.getVideoTracks()
                log('Got stream with constraints:', constraints)
                log('Using video device: ' + videoTracks[0].label)
                stream.active = function () { log('Stream Active') }
                stream.onended = function () { log(stream); log('Stream ended') }
                window.stream = stream; // make variable available to browser console 
                var url = window.URL || window.webkitURL
                video.src = url ? url.createObjectURL(stream) : stream
                video.onloadedmetadata = function (event) { video.play() }
            },
            function (error) {
                log(error.name + ": " + error.message)
                if (error.name === 'ConstraintNotSatisfiedError') {
                    log('The resolution ' + constraints.video.width.exact + 'x' +
                        constraints.video.width.exact + ' px is not supported by your device.');
                } else if (error.name === 'PermissionDeniedError') {
                    log('Permissions have not been granted to use your camera and microphone, you need to allow the page access to your devices in order for the demo to work.')
                }
                log('getUserMedia error: ' + error.name, error);

            })
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

        initAV()
        // Set event listeners for user interface widgets

        //connectButton.addEventListener('click', connectPeers, false)
        //disconnectButton.addEventListener('click', disconnectPeers, false)
        //sendButton.addEventListener('click', sendMessage, false)
    }



    // Set up an event listener which will run the startup
    // function once the page is done loading.

    window.addEventListener('load', startup, false)
})();