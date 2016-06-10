'use strict'

let debugVar, isCaller

let RTCPeerConnection, sdpConstraints, getUserMedia
let pcConfig, gumConstraints, pcOptions, dcOptions
let pc, dc, localStream, remoteStream, localVideo, remoteVideo

let wrtcApp = function () {

    function init() {
        initVars
            .then(initGUM)
            .then(initPC)
            .then(initDC)
            .catch(function (err) { console.error('initCall Error->', err) })
    }

    let initVars = new Promise(function () {
        // Initialize RTC Specific Parameters
        localVideo = document.getElementById('selfView')
        remoteVideo = document.getElementById('remoteView')
        pcConfig = {
            //rtcpMuxPolicy: 'negotiate', bundlePolicy: 'max-compat', RTCIceTransportPolicy: 'all',//To be tested later
            iceServers: [{ urls: 'stun:stun.services.mozilla.com' }, { urls: 'stun:stun.l.google.com:19302' }]
        }
        pcOptions = { optional: [{ DtlsSrtpKeyAgreement: true }, { RtpDataChannels: true }] }
        gumConstraints = { video: false, audio: true }
        dcOptions = { reliable: true, ordered: false }
        switch (detectBrowser().browser) {
            case 'chrome':
                console.info('Chrome Browser Detected')
                sdpConstraints = { mandatory: { 'OfferToReceiveAudio': false, 'OfferToReceiveVideo': false } }
                break
            case 'firefox':
                console.info('FireFox Browser Detected')
                sdpConstraints = { mandatory: { 'offerToReceiveAudio': false, 'offerToReceiveVideo': false } }
                break
            case 'edge':
                console.info('Edge Browser Detected')
                pcConfig =  new  RTCIceGatherOptions()
                pcConfig.gatherPolicy  =  RTCIceGatherPolicy.all
                pcConfig.iceServers = [{ urls: 'stun:stun.services.mozilla.com' }, { urls: 'stun:stun.l.google.com:19302' }]
                //{
                //rtcpMuxPolicy: 'negotiate', bundlePolicy: 'max-compat', RTCIceTransportPolicy: 'all',//To be tested later
                //iceServers: [{ urls: 'stun:stun.services.mozilla.com' }, { urls: 'stun:stun.l.google.com:19302' }]
                //}
                pcOptions = null//{ optional: [{ DtlsSrtpKeyAgreement: true }, { RtpDataChannels: true }] }
                dcOptions = { reliable: true, ordered: false }

                sdpConstraints = { mandatory: { 'offerToReceiveAudio': false, 'offerToReceiveVideo': false } }
                //break

            default:
                alert('Unsupported Browser -> ' + JSON.stringify(detectBrowser()))
                break
        }
        signallingChannel.setHandler(signalHandler)
        console.log('wrtcApp Initialized')
    }, function (err) { console.error('initVars Error->', err) }
    )

    let initPC = new Promise(function (resolve, reject) {
        try {
            //console.debug(pcConfig, pcOptions)
            pc = new window.RTCPeerConnection(pcConfig, pcOptions)
            //pc.onaddstream = pcStreamAdded
            pc.ontrack = pcTrackAdded
            pc.ondatachannel = pcDCAdded
            pc.onicecandidate = pcICEReceived
            pc.oniceconnectionstatechange = pcICEStateChanged
            pc.onsignalingstatechange = pcSIGChanged
            pc.onnegotiationneeded = pcNegNeeded
            pc.onremovestream = pcStreamRemoved
            console.log('Peerchannel Initialised')
            updatePCStatus()
        } catch (error) {
            console.error('PC Error -> ', error)
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

        resolve()
    })

    let initDC = new Promise(function (resolve, reject) {
        try {
            dc = pc.createDataChannel('jfwrtc', dcOptions)
        } catch (error) {
            console.error('DC Error -> ', error)
            reject(error)
        }

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

        resolve()
    })

    let initGUM = new Promise(function (resolve, reject) {

        let mediaReady = function (stream) {
            localStream = stream
            console.debug('gum mediaReady ->', localStream)
            if (window.URL) {
                localVideo.src = window.URL.createObjectURL(localStream)
            } else {
                localVideo.src = localStream
            }
            resolve()
        }

        let mediaFail = function (err) {
            console.error('mediaFail Error -> ', err)
            reject(err)
        }

        navigator.mediaDevices.getUserMedia(gumConstraints)
            .then(mediaReady)
            .catch(mediaFail)

        console.log('getUserMedia Called')
    })

    function signalHandler(msg) {
        console.log('Received Message->', msg)
    }

    return { init, signalHandler }
}