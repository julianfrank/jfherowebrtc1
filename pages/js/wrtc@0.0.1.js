(function () {

    // Define "global" variables
    var connectButton, disconnectButton, sendButton, messageInputBox, receivebox
    var localVideo

    // Functions
    var promisifiedOldGUM = function (constraints) {

        // First get ahold of getUserMedia, if present
        var getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia)

        // Some browsers just don't implement it - return a rejected promise with an error
        // to keep a consistent interface
        if (!getUserMedia) {
            return Promise.reject(new Error('getUserMedia is not implemented in this browser'))
        }

        // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
        return new Promise(function (resolve, reject) {
            getUserMedia.call(navigator, constraints, resolve, reject)
        })

    }

    // Older browsers might not implement mediaDevices at all, so we set an empty object first
    if (navigator.mediaDevices === undefined) {
        navigator.mediaDevices = {}
    }

    // Some browsers partially implement mediaDevices. We can't just assign an object
    // with getUserMedia as it would overwrite existing properties.
    // Here, we will just add the getUserMedia property if it's missing.
    if (navigator.mediaDevices.getUserMedia === undefined) {
        navigator.mediaDevices.getUserMedia = promisifiedOldGUM
    }


    // Prefer camera resolution nearest to 1280x720.
    var constraints = {
        audio: true, video: {
            width: { ideal: 640 },
            height: { ideal: 480 }
        }
    }

    navigator.mediaDevices.getUserMedia(constraints)
        .then(function (stream) {
            var video = document.querySelector('#localVideo')
            video.src = window.URL.createObjectURL(stream)
            video.onloadedmetadata = function (e) {
                video.play()
            }
        })
        .catch(function (err) {
            log(err.name + ": " + err.message)
        })

    // Set things up, connect event listeners, etc.
    function startup() {
        connectButton = document.getElementById('connectButton')
        disconnectButton = document.getElementById('disconnectButton')
        sendButton = document.getElementById('sendButton')
        messageInputBox = document.getElementById('message')
        receiveBox = document.getElementById('receivebox')
        localVideo = document.getElementById('localVideo');

        // Set event listeners for user interface widgets

        //connectButton.addEventListener('click', connectPeers, false)
        //disconnectButton.addEventListener('click', disconnectPeers, false)
        //sendButton.addEventListener('click', sendMessage, false)
    }



    // Set up an event listener which will run the startup
    // function once the page is done loading.

    window.addEventListener('load', startup, false)
})();