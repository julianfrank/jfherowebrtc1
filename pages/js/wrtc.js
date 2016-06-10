'use strict'

let debugVar, isCaller

let RTCPeerConnection, sdpConstraints, getUserMedia
let pcConfig, gumConstraints, pcOptions, dcOptions
let pc, dc, localStream, RemoteStream, signal, initPCDone = false, localUser = null

let wrtcApp = function () {

    function init() {
        return initVars
            .then(initPC)
            .then(initDC)
            .then(initGUM)
            .catch(function (err) { console.error('initCall Error->', err) })
    }

    let initVars = new Promise(function () {
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
                getUserMedia = navigator.webkitGetUserMedia
                break

            case 'firefox':
                console.info('FireFox Browser Detected')
                RTCPeerConnection = window.RTCPeerConnection
                sdpConstraints = { mandatory: { 'offerToReceiveAudio': false, 'offerToReceiveVideo': false } }
                //getUserMedia=navigator.mediaDevices.getUserMedia//Promise based. Equivalent not available in chrome, hence skipping
                getUserMedia = Navigator.mozGetUserMedia
                break

            default:
                alert('Unsupported Browser -> ' + JSON.stringify(detectBrowser()))
                break
        }
        signallingChannel.setHandler(signalHandler)
        console.log('wrtcApp Initialized')
    }, function (err) { console.error('initVars Error->', err) }
    )

    let initPC = new Promise(function () {
        if (!initPCDone) {
            //console.debug(pcConfig, pcOptions)
            pc = new RTCPeerConnection(pcConfig, pcOptions)
            pc.onaddstream = pcStreamAdded
            pc.ontrack = pcTrackAdded
            pc.ondatachannel = pcDCAdded
            pc.onicecandidate = pcICEReceived
            pc.oniceconnectionstatechange = pcICEStateChanged
            pc.onsignalingstatechange = pcSIGChanged
            pc.onnegotiationneeded = pcNegNeeded
            pc.onremovestream = pcStreamRemoved
            console.log('Peerchannel Initialised')
            updatePCStatus()
        }

        function pcStreamAdded(stream) {
            console.debug('onaddstream', stream)
        }
        function pcTrackAdded(event) {
            console.debug('ontrack', event)
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
    }, function (err) { console.error('PC Error -> ', err) }
    )

    let initDC = new Promise(function () {
        dc = pc.createDataChannel('jfwrtc', dcOptions)
        dc.onopen = dcOpened
        dc.onclose = dcClosed
        dc.onmessage = dcMessage
        dc.onerror = dcError
        console.log('DataChannel Initialised')
        updateDCStatus()

        function dcOpened(x) {
            console.log('dc.onopen->', x)
        }
        function dcClosed(x) {
            console.log('dc.onclose->', x)
        }
        function dcMessage(x) {
            console.log('dc.onmessage->', x)
        }
        function dcError(x) {
            console.log('dc.onerror->', x)
        }
        function updateDCStatus() { $('#dcReadyState').text(dc.readyState) }
    }, function (err) { console.error('DC Error -> ', err) }
    )

    let initGUM = new Promise(function () {

        function mediaReady(stream) {
            console.debug('gum mediaReady ->', stream)
        }

        function mediaFail(err) {
            console.error('mediaFail Error -> ', err)
        }

        getUserMedia(gumConstraints, mediaReady, mediaFail)
        console.log('getUserMedia Called')
    }, function (err) { console.error('GUM Error -> ', err) }
    )

    function signalHandler(msg) {
        console.log('Received Message->', msg)
    }

    return { init, signalHandler }
}
/*
$('document')//Call init when document is ready
    .ready(function () {
        wrtcApp().init()
    })*/