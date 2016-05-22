

(function () {
    //'use strict'
    // Define "global" variables
    var connectButton, disconnectButton, sendButton, messageInputBox, receivebox
    var localVideo

    // Functions

    function enumerateDevices() {//Device Enumerator

        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) { return log("enumerateDevices() not supported.") }
        // List cameras and microphones.
        navigator.mediaDevices.enumerateDevices()
            .then(function (devices) { devices.forEach(function (device) { log(device.kind + ": " + device.label + " id = " + device.deviceId) }) })
            .catch(function (err) { log(err.name + ": " + err.message) });

    }

    //Promise based GUM
    var promisifiedOldGUM = function (constraints) {
        // First get ahold of getUserMedia, if present
        var getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia)
        // Some browsers just don't implement it - return a rejected promise with an error to keep a consistent interface
        if (!getUserMedia) { return Promise.reject(new Error('getUserMedia is not implemented in this browser')) }
        // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
        return new Promise(function (resolve, reject) { getUserMedia.call(navigator, constraints, resolve, reject) })
    }

    // Older browsers might not implement mediaDevices at all, so we set an empty object first
    if (navigator.mediaDevices === undefined) { navigator.mediaDevices = {} }
    // Some browsers partially implement mediaDevices. We can't just assign an object with getUserMedia as it would overwrite existing properties.Here, we will just add the getUserMedia property if it's missing.
    if (navigator.mediaDevices.getUserMedia === undefined) { navigator.mediaDevices.getUserMedia = promisifiedOldGUM }

    function initAV() {
        // Prefer camera resolution nearest to 1280x720.
        var constraints = window.constraints = { audio: false, video: true }

        navigator.mediaDevices.getUserMedia(constraints)
            .then(function (stream) {
                var video = document.querySelector('#localVideo')

                var videoTracks = stream.getVideoTracks()
                log('Got stream with constraints:', constraints)
                log('Using video device: ' + videoTracks[0].label)
                stream.active = function () { log('Stream Active') }
                stream.onended = function () { log(stream); log('Stream ended') }
                window.stream = stream; // make variable available to browser console 
                var url = window.URL || window.webkitURL
                video.src = url ? url.createObjectURL(stream) : stream

                video.onloadedmetadata = function (event) {
                    video.play()
                    //enumerateDevices()
                }

            })
            .catch(function (error) {
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