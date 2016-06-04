'use strict'

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
    //offerToReceiveAudio: true,
    //offerToReceiveVideo: true,
    voiceActivityDetection: true,
    iceRestart: false
}

var debugSTR = 'Nothing to debug'

var pcLocal, pcRemote//, isCaller = false

function start(isCaller) {
    console.debug('start called \tisCaller->', isCaller)

    switch (isCaller) {
        case true:
            //Initialize PeerConnection
            pcLocal = new webkitRTCPeerConnection(peerConnectionConfig); console.log('pcLocal Initialized')
            pcLocal.name = 'pcLocal'
            pcLocal.onsignalingstatechange = showPCStateChange
            pcLocal.oniceconnectionstatechange = showPCStateChange

            //Create Offer to Remote
            pcLocal.createOffer(gotLocalDesc, errorHandler)//, offerOptions)

            function gotLocalDesc(desc) {
                console.info('gotLocalDesc', desc)
                pcLocal.setLocalDescription(desc)
                signallingChannel.send(desc)
            }

            break

        case false:
            //Initialize PeerConnection
            pcRemote = new webkitRTCPeerConnection(peerConnectionConfig); console.log('pcRemote Initialized')
            pcRemote.name = 'pcRemote'
            pcRemote.onsignalingstatechange = showPCStateChange
            pcRemote.oniceconnectionstatechange = showPCStateChange
            break

        default:
            console.error('Start Called with invalid isCaller ->', isCaller)
            break
    }

    //Show Signalling state
    function showPCStateChange(event) {
        //console.debug(event)
        let thisPC = event.currentTarget
        console.info('PC Changed -> ', thisPC.name, '\tChangeType->', event.type,
            '\niceConnectionState->', thisPC.iceConnectionState, '\ticeGatheringState->', thisPC.iceGatheringState,
            '\nsignalingState->', thisPC.signalingState)
    }

}

function errorHandler(err) {
    console.error('Error-> ', err)
}

function pageReady() {
    //Handle all SocketIO Messages here
    signallingChannel.signalHandler = (msg) => {
        let signal = msg.message
        setTarget(msg.from)
        switch (signal.type) {

            case 'offer':
                console.debug('Offer Received')
                start(false)
                pcRemote.setRemoteDescription(new RTCSessionDescription(signal))
                //Media Add to be done here
                pcRemote.createAnswer(gotRemoteDesc, errorHandler)//, offerOptions)
                function gotRemoteDesc(desc) {
                    console.info('gotRemoteDesc', desc)
                    pcRemote.setLocalDescription(desc)
                    signallingChannel.send(desc)
                }
                break

            case 'answer':
                pcLocal.setRemoteDescription(signal)
                break

            default:
                console.debug('Signal Received-> ', signal, '\nType-> ', typeof signal)
                break
        }
    }
}

// Set up an event listener which will run the startup
// function once the page is done loading.
window.addEventListener('load', pageReady, false)