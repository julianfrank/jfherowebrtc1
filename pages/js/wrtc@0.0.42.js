'use strict'

let localVideo, remoteVideo, peerConnection, localStream, remoteStream
let connectButton, disconnectButton

var peerConnectionConfig = {
    rtcpMuxPolicy: 'negotiate',
    bundlePolicy: 'max-compat',
    RTCIceTransportPolicy: 'all',
    iceServers: [
        { urls: 'stun:stun.services.mozilla.com' },
        { urls: 'stun:stun.l.google.com:19302' }
    ]
}
var constraints = { video: true, audio: true }
var offerOptions = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,
    voiceActivityDetection: true,
    iceRestart: false
}

var debugSTR = 'Nothing to debug'

window.URL = window.URL || window.webkitURL

function pageReady() {
    uuid = uuid()
    connectButton = document.getElementById('connectButton')
    disconnectButton = document.getElementById('disconnectButton')
    localVideo = document.getElementById('localVideo')
    remoteVideo = document.getElementById('remoteVideo')

    signallingChannel.signalHandler = gotMessageFromServer


    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints)
            .then(getUserMediaSuccess)
            .catch(errorHandler)
    } else {
        alert('Your browser does not support getUserMedia API')
    }
}

function getUserMediaSuccess(stream) {
    localStream = stream;
    //--
    window.localStream = localStream // make variable available to browser console 
    var url = window.URL || window.webkitURL
    localVideo.src = url ? url.createObjectURL(stream) : stream

    localVideo.onloadedmetadata = function () {
        localVideo.play()
        localVideo.muted = true
        log('Local Video has dimension ' + localVideo.videoWidth + ' x ' + localVideo.videoHeight)
    }
    //--

}

function start(isCaller) {
    peerConnection = new RTCPeerConnection(peerConnectionConfig)
    //peerConnection.onsignalingstatechange = signalChanged
    peerConnection.oniceconnectionstatechange = signalChanged
    peerConnection.onicecandidate = gotIceCandidate
    peerConnection.onaddstream = gotRemoteStream//Replaced by ontrack
    peerConnection.ontrack = gotRemoteStream
    /*
    if (localStream.getAudioTracks().length > 0)
        peerConnection.addTrack(localStream.getAudioTracks()[0], localStream)
    if (localStream.getVideoTracks().length > 0)
        peerConnection.addTrack(localStream.getVideoTracks()[0], localStream)
    //---*/
    peerConnection.addStream(localStream)

    peerConnection.onnegotiationneeded = negoNeeded
    createOffer(isCaller)
}

function createOffer(isCaller) {
    if (isCaller) {
        peerConnection.createOffer(offerOptions)
            .then(createdDescription)
            .catch(errorHandler)
    }
}

function negoNeeded() {
    log('Nego Needed Called - No code to handle this event')
    peerConnection.createOffer()
        .then(function (offer) {
            return peerConnection.setLocalDescription(offer)
        })
        .then(function () {
            signallingChannel.send({ 'sdp': peerConnection.localDescription })
        })
        .catch(errorHandler)
}

function signalChanged(state) {
    log('state.currentTarget.iceConnectionState ->' + state.currentTarget.iceConnectionState)
    let readyStateType = [
        '0 = HAVE_NOTHING - no information whether or not the audio/video is ready',
        '1 = HAVE_METADATA - metadata for the audio/video is ready',
        '2 = HAVE_CURRENT_DATA - data for the current playback position is available, but not enough data to play next frame/millisecond',
        '3 = HAVE_FUTURE_DATA - data for the current and at least the next frame is available',
        '4 = HAVE_ENOUGH_DATA - enough data available to start playing'
    ]
    let networkStateType = [
        '0 = NETWORK_EMPTY - audio/video has not yet been initialized',
        '1 = NETWORK_IDLE - audio/video is active and has selected a resource, but is not using the network',
        '2 = NETWORK_LOADING - browser is downloading data',
        '3 = NETWORK_NO_SOURCE - no audio/video source found'
    ]
    log('remoteVideo.readyState ->' + readyStateType[remoteVideo.readyState] + '\t' + 'remoteVideo.networkState ->' + networkStateType[remoteVideo.networkState])
}
function gotMessageFromServer(message) {
    if (!peerConnection) start(false)

    var signal = message.message

    // Ignore messages from ourself
    if (signal.uuid == uuid) return

    if (signal.sdp) {
        log('Responding to SDP ->' + JSON.stringify(signal.sdp.type))
        switch (signal.sdp.type) {
            case 'offer':
                log('createAnswer')
                peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp))
                    .then(function () { return peerConnection.createAnswer() })
                    .then(createdDescription)
                    .catch(errorHandler)
                break
            case 'answer':
                log('signal.sdp.type->answer\t CODE MAY NOT BE VALID')
                peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp))
                    .catch(errorHandler)
                break

            default:
                log('Unhandled SDP ->' + JSON.stringify(signal.sdp))
                break
        }

        /*Old Code
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp))
            .then(function () {
                // Only create answers in response to offers

            })
            .catch(errorHandler)*/
    } else if (signal.ice) {
        log('Responding to ICE ->' + JSON.stringify(signal.ice.sdpMid))

        peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice))
            //peerConnection.addIceCandidate(signal.ice)
            .catch(errorHandler)
    }
}

function gotIceCandidate(event) {
    if (event.candidate != null) {
        log('Sending ICE ->' + JSON.stringify(event.candidate.sdpMid))
        signallingChannel.send({ 'ice': event.candidate, 'uuid': uuid })
    } else {//30May
        log('Sending SDP in response to null candidate')//30May
        signallingChannel.send({ 'sdp': peerConnection.localDescription })//30May
        attachRemoteStreamToSrc()//31May
    }
}

function createdDescription(description) {
    peerConnection.setLocalDescription(description)
        .then(function () {
            log('Sending SDP ->' + JSON.stringify(peerConnection.localDescription.type))
            signallingChannel.send({ 'sdp': peerConnection.localDescription, 'uuid': uuid })
        })
        .catch(errorHandler)
}

function gotRemoteStream(event) {
    log('got remote stream of type ->' + event.type)

    if (typeof event.stream === 'object') {
        remoteStream = event.stream
    } else {
        remoteStream = event.streams[0]
    }
}

function attachRemoteStreamToSrc() {
    var url = window.URL || window.webkitURL

    //remoteVideo.src = url ? url.createObjectURL(remoteStream) : remoteStream
    remoteVideo.srcObject = remoteStream

    remoteVideo.onloadedmetadata = function () {
        switch (adapter.browserDetails.browser) {

            case 'chrome':
                remoteVideo.play()
                    .then((x) => {
                        log('Received Video with dimension ' + remoteVideo.videoWidth + ' x ' + remoteVideo.videoHeight)
                    })
                break;

            default:
                remoteVideo.play()
                log('Received Video with dimension ' + remoteVideo.videoWidth + ' x ' + remoteVideo.videoHeight)
                break;
        }
    }
    //---
}

function errorHandler(error) {
    log(error)
}

function uuid() {
    // Taken from http://stackoverflow.com/a/105074/515584  Strictly speaking, it's not a real UUID, but it gets the job done here
    function s4() { return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1) }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()
}

// Set up an event listener which will run the startup
// function once the page is done loading.
window.addEventListener('load', pageReady, false)