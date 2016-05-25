var pc, localStream

// Define "global" variables
var connectButton, disconnectButton, sendButton, messageInputBox, receivebox, localVideo
var getUserMedia = navigator.getUserMedia//navigator.mediaDevices.getUserMedia || navigator.webkitGetUserMedia ||  || navigator.msGetUserMedia)
var constraints = window.constraints = { audio: true, video: true }
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
var pc_config = { 'iceServers': [{ 'urls': ['stun:stun.services.mozilla.com', 'stun:stun.l.google.com:19302'] }] }
pc = new RTCPeerConnection(pc_config)

var debugstr

var signallingChannel = {
    localUser: null,
    remoteUser: 'Guest@jfkalab.onmicrosoft.com',
    channel: null,

    init: function (local, channel) {
        signallingChannel.localUser = local
        signallingChannel.channel = channel
        var tempChannel = signallingChannel.channel
        signallingChannel.channel.on('s2cWRTC', function (msg) {
            let cleanmsg = JSON.parse(String(JSON.stringify(msg)))
            switch (cleanmsg.event) {
                case 'wrtcSignal':
                    signalResponder(cleanmsg)
                    break;
                case 'req':
                    signallingChannel.remoteUser = cleanmsg.from
                    disconnectButton.disabled = false
                    disconnectButton.innerText = 'Disconnect ' + signallingChannel.remoteUser.slice(0, -24)
                    var ack = { event: 'ack', from: signallingChannel.localUser, to: signallingChannel.remoteUser }
                    debugstr = ack
                    tempChannel.emit('c2sWRTC', ack)
                    break
                case 'ack':
                    log('Acknowledgement received from ' + cleanmsg.from)
                    signallingChannel.remoteUser = cleanmsg.from
                    disconnectButton.disabled = false
                    disconnectButton.innerText = 'Disconnect ' + signallingChannel.remoteUser.slice(0, -24)
                    break
                default:
                    log('s2cRTC got unhandled message->' + cleanmsg)
                    break
            }
        })
    },
    setTarget: function (target) {
        signallingChannel.remoteUser = target
        connectButton.disabled = false
        connectButton.innerText = 'Connect ' + signallingChannel.remoteUser.slice(0, -24)
    },
    connect: function () {
        connectButton.disabled = true
        disconnectButton.disabled = false
        var req = { event: 'req', to: signallingChannel.remoteUser, from: signallingChannel.localUser }
        signallingChannel.channel.emit('c2sWRTC', req)
    },
    send: function (msg) {
        signallingChannel.channel.emit('c2sWRTC', {
            event: 'wrtcSignal',
            from: signallingChannel.localUser, to: signallingChannel.remoteUser,
            message: msg
        })
    }
}

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
                    video.muted = true
                    pc.addStream(stream);
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

            pc.onaddstream = gotRemoteStream;
            pc.createOffer(gotDescription, createOfferError)
            pc.onicecandidate = gotIceCandidate

            log("Created RTCPeerConnnection with config:\t" + JSON.stringify(pc_config))
        } catch (e) {
            reject("Failed to create PeerConnection, exception: " + e.message)
            alert("Cannot create RTCPeerConnection object; WebRTC is not supported by this browser.")
            return
        }

        resolve()
    })
}
function gotDescription(description) {
    log('got description');
    pc.setLocalDescription(description, function () {
        signallingChannel.send({ 'sdp': description })
        log('gotLocalDescription->Sending->' + JSON.stringify({ 'sdp': description }))
    }, function () { log('set description error') });
}
function gotIceCandidate(event) {
    if (event.candidate != null) {
        signallingChannel.send({ 'ice': event.candidate })
        log('gotICECandidate->Sending ->' + JSON.stringify({ 'ice': event.candidate }))
    }
}
function gotRemoteStream(event) {
    log("got remote stream");
    remoteVideo.src = window.URL.createObjectURL(event.stream);
}
            function createOfferError(error) {
                log('Create Offer Error -> ' + error);
            }
            
var signalResponder = function (msg) {
    var signal = msg.message
    log('Signalresponder got ->' + JSON.stringify(signal.sdp))
    if (signal.sdp) {
        pc.setRemoteDescription(new RTCSessionDescription(signal.sdp), function () {
            pc.createAnswer(gotDescription, createAnswerError)
        }, function (error) {
            log('pc.setRemoteDecription error->' + error)
        })
    } else if (signal.ice) {
        peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice));
    }
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
