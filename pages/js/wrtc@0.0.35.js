var debugstr
var signalResponder = function (msg) {
    log('Ready to handle ->' + JSON.stringify(msg))
}
var signallingChannel = {
    localUser: null,
    remoteUser: 'Guest@jfkalab.onmicrosoft.com',
    channel: null,

    init: function (local, channel) {
        this.localUser = local
        this.channel = channel
        tempChannel = this.channel
        this.channel.on('s2cWRTC', function (msg) {
            log('s2cWRTC got a message ->' + JSON.stringify(msg))
            this.remoteUser = String(msg.from)
            debugstr = msg
            disconnectButton.disabled = false
            disconnectButton.innerText = 'Disconnect ' + this.remoteUser.slice(0, -24)
            tempChannel.emit('c2sWRTC', { event: 'ack', from: this.localUser, to: this.remoteUser })
            signalResponder(msg)
        })
    },
    setTarget: function (target) {
        this.remoteUser = target
        connectButton.disabled = false
        connectButton.innerText = 'Connect ' + this.remoteUser.slice(0, -24)
    },
    connect: function () {
        connectButton.disabled = true
        disconnectButton.disabled = false
        this.channel.emit('c2sWRTC', { event: "req", from: this.localUser, to: this.remoteUser })
        log('Sent Request to' + this.remoteUser)
    },
    send: function (msg) {
        channel.emit('c2sWRTC', {
            event: 'wrtcSignal',
            from: this.localUser, to: this.remoteUser,
            message: msg
        })
    }
}


var pc, localStream

// Define "global" variables
var connectButton, disconnectButton, sendButton, messageInputBox, receivebox, localVideo
var getUserMedia = navigator.getUserMedia//navigator.mediaDevices.getUserMedia || navigator.webkitGetUserMedia ||  || navigator.msGetUserMedia)
var constraints = window.constraints = { audio: true, video: false }
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
var pc_config = { 'iceServers': [{ 'urls': ['stun:stun.services.mozilla.com', 'stun:stun.l.google.com:19302'] }] }


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
                    localStream = stream
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

            pc.onaddstream = gotRemoteStream;
            pc.createOffer(gotDescription, createOfferError)
            pc.addStream(localStream);

            function createOfferError(error) {
                log('Create Offer Error -> ' + error);
            }

            function gotDescription(description) {
                log('got description');
                pc.setLocalDescription(description, function () {
                    signallingChannel.send(JSON.stringify({ 'sdp': description }))
                    log('gotLocalDescription->Sending->' + JSON.stringify({ 'sdp': description }))
                }, function () { log('set description error') });
            }

            pc.onicecandidate = gotIceCandidate
            function gotIceCandidate(event) {
                if (event.candidate != null) {
                    signallingChannel.send(JSON.stringify({ 'ice': event.candidate }))
                    log('gotICECandidate->Sending ->' + JSON.stringify({ 'ice': event.candidate }))
                }
            }

            function gotRemoteStream(event) {
                log("got remote stream");
                remoteVideo.src = window.URL.createObjectURL(event.stream);
            }
            log("Created RTCPeerConnnection with config:\t" + JSON.stringify(pc_config))
        } catch (e) {
            reject("Failed to create PeerConnection, exception: " + e.message)
            alert("Cannot create RTCPeerConnection object; WebRTC is not supported by this browser.")
            return
        }



        resolve()
    })
}



var initConnect = function () {
    signallingChannel.connect()
    connectPeers()
        .then(initAV)
        .then((stream) => {
            log('Init AV Initialized')
        })
        .catch((err) => { log(err) })
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
// Set up an event listener which will run the startup
// function once the page is done loading.
window.addEventListener('load', startup, false)
