'use strict'

let debugVar

let RTCPeerConnection, sdpConstraints, getUserMedia
let pcConfig, gumConstraints, pcOptions, dcOptions
let pc, dc, localStream, remoteStream, localVideo, remoteVideo

let VideoReadyStates = ['Nothing', 'MetaData', 'CurrentData', 'FutureData', 'EnoughData'],
    VideoNetworkStates = ['Empty', 'Idle', 'Loading', 'NoSource']

function wrtcApp() {

    function call(isCaller) {
        initVars()
            .then(initGUM)
            .then(initPC)
            .then(initDC)
            .catch(function (err) { console.error('initCall Error->', err) })
    }

    let initVars = function (isCaller) {
        return new Promise(function (resolve, reject) {

            // Initialize RTC Specific Parameters
            localVideo = document.getElementById('selfView')
            remoteVideo = document.getElementById('remoteView')
            pcConfig = {
                //rtcpMuxPolicy: 'negotiate', bundlePolicy: 'max-compat', RTCIceTransportPolicy: 'all',//To be tested later
                iceServers: [{ urls: 'stun:stun.services.mozilla.com' }, { urls: 'stun:stun.l.google.com:19302' }]
            }
            pcOptions = { optional: [{ DtlsSrtpKeyAgreement: true }, { RtpDataChannels: true }] }
            dcOptions = { reliable: true, ordered: false }
            switch (detectBrowser().browser) {
                case 'chrome':
                    console.info('Chrome Browser Detected')
                    gumConstraints = { video: true, audio: true }
                    sdpConstraints = { mandatory: { 'OfferToReceiveAudio': false, 'OfferToReceiveVideo': false } }
                    break
                case 'firefox':
                    console.info('FireFox Browser Detected')
                    let getSupportedConstraints = navigator.mediaDevices.getSupportedConstraints(); console.info(getSupportedConstraints)
                    navigator.mediaDevices.enumerateDevices().then(function (x) { console.info(x) })
                    gumConstraints = { video: true, audio: true }
                    sdpConstraints = { mandatory: { 'offerToReceiveAudio': false, 'offerToReceiveVideo': false } }
                    break
                case 'edge':
                    console.info('Edge Browser Detected')
                    pcConfig = new RTCIceGatherOptions()
                    pcConfig.gatherPolicy = RTCIceGatherPolicy.all
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
                    reject('initVars Error')
                    break
            }
            console.info('wrtcApp Initialized')
            resolve(isCaller)
        })
    }

    let initPC = function (isCaller) {
        return new Promise(function (resolve, reject) {
            try {
                //console.info(pcConfig, pcOptions)
                pc = new window.RTCPeerConnection(pcConfig, pcOptions)
                //pc.onaddstream = pcStreamAdded
                pc.ontrack = pcTrackAdded
                pc.ondatachannel = pcDCAdded
                pc.onicecandidate = pcICEReceived
                pc.oniceconnectionstatechange = pcICEStateChanged
                pc.onsignalingstatechange = pcSIGChanged
                pc.onnegotiationneeded = pcNegNeeded
                pc.onremovestream = pcStreamRemoved
                console.info('Peerchannel Initialised')
                updatePCStatus()
            } catch (error) {
                console.error('PC Error -> ', error)
            }

            function pcStreamAdded(stream) {
                console.info('onaddstream', stream)
            }
            function pcTrackAdded(event) {
                console.info('ontrack', event)
            }
            function pcDCAdded(x) {
                console.info('ondatachannel', x)
            }
            function pcStreamRemoved(x) {
                console.info('onremovestream', x)
            }
            function pcICEReceived(x) {
                console.info('onicecandidate', x)
            }
            function pcICEStateChanged(x) {
                console.info('oniceconnectionstatechange', x)
                updatePCStatus()
            }
            function pcSIGChanged(signalingstatechange) {
                //console.info('onsignalingstatechange', signalingstatechange )
                updatePCStatus()
            }
            function pcNegNeeded(event) {
                console.info('onnegotiationneeded')
                return pc.createOffer().then(offerReady).catch(pcError)
            }
            function offerReady(sdp) {
                console.info('offer ready')
                return (pc.signalingState === "have-local-offer") ? pcError('Skipping setLocalDescription') : pc.setLocalDescription(sdp).then(localSDPset).catch(pcError)
                function localSDPset() {//Nothing gets passed here hence moving the function definition inside offerReady to use the sdp
                    console.info('Local Desciption is Set ->', sdp)
                    signallingChannel.send({ type: 'sdp', message: sdp })
                }
            }

            function pcError(err) {
                console.error('pc error -> ', err)
            }
            function updatePCStatus() {
                $('#pcSigState').text(pc.signalingState)
                $('#pcICEGatherState').text(pc.iceGatheringState)
                $('#pcICEConnState').text(pc.iceConnectionState)
            }

            resolve(isCaller)
        })
    }

    let initDC = function (isCaller) {
        return new Promise(function (resolve, reject) {
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
            console.info('DataChannel Initialised')
            updateDCStatus()

            function dcOpened(x) {
                console.info('dc.onopen->', x)
            }
            function dcClosed(x) {
                console.info('dc.onclose->', x)
            }
            function dcMessage(x) {
                console.info('dc.onmessage->', x)
            }
            function dcError(x) {
                console.info('dc.onerror->', x)
            }
            function updateDCStatus() { $('#dcReadyState').text(dc.readyState) }

            resolve(isCaller)
        })
    }

    let initGUM = function (isCaller) {
        return new Promise(function (resolve, reject) {

            let mediaReady = function (stream) {
                localStream = stream
                console.info('gum mediaReady')
                switch (detectBrowser().browser) {
                    case 'chrome':
                        localVideo.srcObject = localStream
                        break
                    case 'firefox':
                        localVideo.srcObject = localStream
                        break
                    default:
                        alert('Unsupported Browser -> ' + JSON.stringify(detectBrowser()))
                        localVideo.srcObject = localStream
                        break
                }
                updateLocalVideoStats()
                localVideo.oncanplay = function () {
                    //console.info('oncanplay')
                    localVideo.play()
                    localVideo.muted = true
                    updateLocalVideoStats()
                }
                resolve(isCaller)
            }

            function updateLocalVideoStats() {
                $('#LVreadyState').text(VideoReadyStates[localVideo.readyState])
                $('#LVnetworkState').text(VideoNetworkStates[localVideo.networkState])
                $('#LVsize').text(localVideo.videoWidth + '*' + localVideo.videoHeight)
            }

            function mediaFail(err) {
                console.error('mediaFail Error -> ', err)
                reject(err)
            }

            navigator.mediaDevices.getUserMedia(gumConstraints)
                .then(mediaReady)
                .catch(mediaFail)

            console.info('getUserMedia Called')
        })
    }

    function signalHandler(msg) {
        console.info('Received Message->', msg)
    }

    function sigHandlerExport() {
        return signalHandler
    }

    return { call, sigHandlerExport }
}