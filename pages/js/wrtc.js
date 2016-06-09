'use strict'

let debugVar, isCaller

let RTCPeerConnection, sdpConstraints
let pcConfig, gumConstraints, pcOptions, dcOptions

var wrtcApp = function () {

    let pc, dc, localStream, RemoteStream, signal, initPCDone = false, localUser = null

    function init() {

        // Initialize RTC Specific Parameters
        pcConfig = {
            //rtcpMuxPolicy: 'negotiate', bundlePolicy: 'max-compat', RTCIceTransportPolicy: 'all',//To be tested later
            iceServers: [{ urls: 'stun:stun.services.mozilla.com' }, { urls: 'stun:stun.l.google.com:19302' }]
        }
        pcOptions = { optional: [{ DtlsSrtpKeyAgreement: true }, { RtpDataChannels: true }] }
        gumConstraints = { video: true, audio: true }
        dcOptions = { reliable: true, ordered: false }
        switch (detectBrowser().browser) {
            case 'chrome':
                console.info('Chrome Browser Detected')
                RTCPeerConnection = window.webkitRTCPeerConnection
                sdpConstraints = { mandatory: { 'OfferToReceiveAudio': false, 'OfferToReceiveVideo': false } }
                break

            case 'firefox':
                console.info('FireFox Browser Detected')
                RTCPeerConnection = window.RTCPeerConnection
                sdpConstraints = { mandatory: { 'offerToReceiveAudio': false, 'offerToReceiveVideo': false } }
                break

            default:
                alert('Unsupported Browser -> ' + JSON.stringify(detectBrowser()))
                break
        }
    }

    function initPC() {
        if (!initPCDone) {
            console.debug(pcConfig, pcOptions)
            pc = new RTCPeerConnection(pcConfig, pcOptions)
            updatePCStatus()
            pc.onaddstream = pcStreamAdded
            pc.ondatachannel = pcDCAdded
            pc.onicecandidate = pcICEReceived
            pc.oniceconnectionstatechange = pcICEStateChanged
            pc.onsignalingstatechange = pcSIGChanged
            pc.onnegotiationneeded = pcNegNeeded
            pc.onremovestream = pcStreamRemoved
        }
    }
    function pcStreamAdded(stream) {
        console.debug('onaddstream', stream)
    }
    function pcDCAdded(x) {
        console.debug('ondatachannel', x)
    }
    function pcStreamRemoved(x) {
        console.debug('onremovestream', x)
    }
    function pcICEReceived(x) {
        console.debug('onicecandidate', x)
    }
    function pcICEStateChanged(x) {
        console.debug('oniceconnectionstatechange', x)
    }
    function pcSIGChanged(x) {
        console.debug('onsignalingstatechange', x)
    }
    function pcNegNeeded(x) {
        console.debug('onnegotiationneeded', x)
    }
    function updatePCStatus() {
        $('#pcSigState').text(pc.signalingState)
        $('#pcICEGatherState').text(pc.iceGatheringState)
        $('#pcICEConnState').text(pc.iceConnectionState)
    }

    function signalHandler(msg) {
        console.log('Received Message->', msg)
    }
    return { init, initPC }
}