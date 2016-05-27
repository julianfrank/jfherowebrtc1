'use strict'

let localVideo, remoteVideo, peerConnection, localStream
let connectButton, disconnectButton

var url = window.URL || window.webkitURL
var peerConnectionConfig = { 'iceServers': [{ 'urls': 'stun:stun.services.mozilla.com' }, { 'urls': 'stun:stun.l.google.com:19302' },] }
var constraints = { video: true, audio: true, }

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
    //localVideo.src = window.URL.createObjectURL(stream)
    //--
    window.stream = localStream // make variable available to browser console 
    localVideo.src = url ? url.createObjectURL(localStream) : localStream
    localVideo.onloadedmetadata = function (event) {
        localVideo.play()
        //localVideo.muted = true
    }
    //--
}

function start(isCaller) {
    peerConnection = new RTCPeerConnection(peerConnectionConfig)
    peerConnection.onicecandidate = gotIceCandidate
    //peerConnection.onaddstream = gotRemoteStream
    peerConnection.ontrack = gotRemoteStream
    //peerConnection.addStream(localStream)
    peerConnection.addstream(localStream)

    if (isCaller) {
        peerConnection.createOffer()
            .then(createdDescription)
            .catch(errorHandler)
    }
}

function gotMessageFromServer(message) {
    if (!peerConnection) start(false)

    var signal = message.message

    // Ignore messages from ourself
    if (signal.uuid == uuid) return

    if (signal.sdp) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp))
            .then(function () {
                // Only create answers in response to offers
                if (signal.sdp.type == 'offer') { peerConnection.createAnswer().then(createdDescription).catch(errorHandler) }
            })
            .catch(errorHandler)
    } else if (signal.ice) {
        peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler)
    }
}

function gotIceCandidate(event) {
    log('got ICE')
    if (event.candidate != null) {
        signallingChannel.send({ 'ice': event.candidate, 'uuid': uuid })
    }
}

function createdDescription(description) {
    log('got SDP')
    peerConnection.setLocalDescription(description)
        .then(function () { signallingChannel.send({ 'sdp': peerConnection.localDescription, 'uuid': uuid }) })
        .catch(errorHandler)
}

function gotRemoteStream(event) {
    log('got remote stream')
    //remoteVideo.src = window.URL.createObjectURL(event.stream)
    //---
    window.stream = event.stream // make variable available to browser console 
    remoteVideo.src = url ? url.createObjectURL(event.stream) : event.stream
    remoteVideo.onloadedmetadata = function (event) {
        remoteVideo.play()
        //remoteVideo.muted = true
    }
    //---
}

function errorHandler(error) {
    log('Error->' + error)
}

function uuid() {
    // Taken from http://stackoverflow.com/a/105074/515584  Strictly speaking, it's not a real UUID, but it gets the job done here
    function s4() { return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1) }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()
}

// Set up an event listener which will run the startup
// function once the page is done loading.
window.addEventListener('load', pageReady, false)