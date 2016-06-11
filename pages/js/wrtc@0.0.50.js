'use strict'

let debugVar

let RTCPeerConnection, sdpConstraints, getUserMedia
let pcConfig, gumConstraints, pcOptions, dcOptions
let pc, dc, localStream, remoteStream, localVideo, remoteVideo, dcChannel

let VideoReadyStates = ['Nothing', 'MetaData', 'CurrentData', 'FutureData', 'EnoughData'],
    VideoNetworkStates = ['Empty', 'Idle', 'Loading', 'NoSource']

function wrtcApp() {

    function call(callParams) {
        initVars(callParams).then(initPC).then(initGUM).then(initDC).catch(function (err) { console.error('initCall Error->', err) })
    }

    function initVars(callParams) {
        return new Promise(function (resolve, reject) {

            // Initialize RTC Specific Parameters
            localVideo = document.getElementById('selfView')
            remoteVideo = document.getElementById('remoteView')
            pcConfig = {
                //rtcpMuxPolicy: 'negotiate', bundlePolicy: 'max-compat', RTCIceTransportPolicy: 'all',//To be tested later
                iceServers: [{ urls: 'stun:stun.services.mozilla.com' }]//, { urls: 'stun:stun.l.google.com:19302' }]
            }
            pcOptions = { optional: [{ DtlsSrtpKeyAgreement: true }, { RtpDataChannels: true }] }
            dcOptions = { reliable: true, ordered: false }
            switch (detectBrowser().browser) {
                case 'chrome':
                    console.info('Chrome Browser Detected')
                    gumConstraints = { video: true, audio: true }
                    sdpConstraints = { mandatory: { 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true } }
                    break
                case 'firefox':
                    console.info('FireFox Browser Detected')
                    let getSupportedConstraints = navigator.mediaDevices.getSupportedConstraints(); console.info(getSupportedConstraints)
                    navigator.mediaDevices.enumerateDevices().then(function (x) { console.info(x) })
                    gumConstraints = { video: true, audio: true }
                    sdpConstraints = { mandatory: { 'offerToReceiveAudio': true, 'offerToReceiveVideo': true } }
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

                    sdpConstraints = { mandatory: { 'offerToReceiveAudio': true, 'offerToReceiveVideo': true } }
                //break

                default:
                    alert('Unsupported Browser -> ' + JSON.stringify(detectBrowser()))
                    reject('initVars Error')
                    break
            }
            console.info('wrtcApp Initialized')
            resolve(callParams)
        })
    }

    function initPC(callParams) {
        return new Promise(function (resolve, reject) {
            try {
                //console.info(pcConfig, pcOptions)
                pc = new window.RTCPeerConnection(pcConfig, pcOptions)
                pc.onaddstream = pcStreamAdded
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

            function pcStreamAdded(MediaStreamEvent) {
                console.info('onaddstream', MediaStreamEvent.stream.id)
                //remoteStream = MediaStreamEvent.stream
                //addRemoteStream(MediaStreamEvent.stream)
            }
            function pcTrackAdded(event) {
                console.info('ontrack', event.streams[0].id)
                remoteStream = event.streams[0]
                addRemoteStream(event.streams[0])
            }
            function addRemoteStream(stream) {
                remoteVideo.srcObject = stream
                updateRemoteVideoStats()
                remoteVideo.oncanplay = function () {
                    console.info('remoteVideo.oncanplay')
                    remoteVideo.play()
                    remoteVideo.muted = true
                    updateRemoteVideoStats()
                }
            }

            function updateRemoteVideoStats() {
                $('#RVreadyState').text(VideoReadyStates[remoteVideo.readyState])
                $('#RVnetworkState').text(VideoNetworkStates[remoteVideo.networkState])
                $('#RVsize').text(remoteVideo.videoWidth + '*' + remoteVideo.videoHeight)
            }

            function pcDCAdded(dc) {
                console.info('ondatachannel')
                $('#dcReadyState').text(dc.readyState)
            }
            function pcStreamRemoved(x) {
                console.info('onremovestream', x)
            }
            function pcICEReceived(RTCIceCandidateEvent) {
                console.info('onicecandidate', !!RTCIceCandidateEvent.candidate)
                if (RTCIceCandidateEvent.candidate != null) {
                    signallingChannel.send({ type: 'ice', iceMsg: RTCIceCandidateEvent.candidate })
                }
            }
            function pcICEStateChanged(Eventx) {
                console.info('oniceconnectionstatechange', pc.iceConnectionState, callParams.type)
                updatePCStatus()
                if (pc.iceConnectionState === 'completed') { pc.addStream(localStream) }
            }
            function pcSIGChanged(signalingstatechange) {
                //console.info('onsignalingstatechange', signalingstatechange )
                updatePCStatus()
            }
            function pcNegNeeded(event) {
                console.info('onnegotiationneeded')
                switch (callParams.type) {
                    case 'newCall':
                        pc.createOffer().then(offerReady).catch(pcError)
                        break
                    case 'incomingCall':
                        //console.debug(callParams.sdp)
                        offerReceived(new RTCSessionDescription(callParams.sdp))
                        break
                    default:
                        console.error('Invalid Call Params -> ', callParams)
                        break
                }
            }
            function offerReady(sdp) {
                console.info('offer ready')
                let offerSDP = new window.RTCSessionDescription(sdp)
                return pc.setLocalDescription(offerSDP).then(sendOfferSDP).catch(pcError)
                function sendOfferSDP() {//Nothing gets passed here hence moving the function definition inside offerReady to use the sdp
                    console.info('Local Desciption is Set with Offer')
                    signallingChannel.send({ type: 'sdp', message: offerSDP })
                }
            }
            function offerReceived(sdp) {
                console.info('Offer received')
                pc.setRemoteDescription(sdp).then(remoteSDPset).then(prepareResponseSDP).catch(pcError)//[KNOWN PROBLEM]Firefox SDP is not accepted in Chrome
                function remoteSDPset() {//Nothing gets passed here hence moving the function definition inside offerReady to use the sdp
                    console.info('Remote Desciption is Set')
                    //signallingChannel.send({ type: 'sdp', message: sdp })
                }
                function prepareResponseSDP() {
                    console.info('createAnswer Initiated')
                    pc.createAnswer(sdpConstraints).then(replyReady).catch(pcError)
                }
                function replyReady(sdp) {
                    console.info('Answer ready')
                    let answerSDP = new window.RTCSessionDescription(sdp)
                    pc.setLocalDescription(answerSDP).then(sendReplySDP).catch(pcError)
                    function sendReplySDP() {//Nothing gets passed here hence moving the function definition inside offerReady to use the sdp
                        console.info('Local Desciption is Set with Answer');
                        sendAnswerSDPonceonly()
                        function sendAnswerSDPonceonly() {
                            sendAnswerSDPonceonly = function () { }
                            signallingChannel.send({ type: 'sdp', message: answerSDP })
                        }
                    }
                }
            }

            function pcError(err) {
                console.error('pc error -> ', err, pc.signalingState)
            }
            function updatePCStatus() {
                $('#pcSigState').text(pc.signalingState)
                $('#pcICEGatherState').text(pc.iceGatheringState)
                $('#pcICEConnState').text(pc.iceConnectionState)
            }

            resolve(callParams)
        })
    }

    function initDC(callParams) {
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

            function dcOpened(dc) {
                console.info('dc.onopen', dc)
                updateDCStatus()
                dcChannel = dc
                dcChannel.send('Testing DC')
            }
            function dcClosed(event) {
                console.info('dc.onclose')
                updateDCStatus()
            }
            function dcMessage(x) {
                console.info('dc.onmessage->', x)
            }
            function dcError(err) {
                console.info('dc.onerror->', err)
            }
            function updateDCStatus() { $('#dcReadyState').text(dc.readyState) }

            resolve(callParams)
        })
    }

    function initGUM(callParams) {
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
                    //pc.addStream(localStream)
                }
                resolve(callParams)
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

            switch (callParams.type) {
                case 'newCall':
                    navigator.mediaDevices.getUserMedia(gumConstraints).then(mediaReady).catch(mediaFail)
                    break
                case 'incomingCall':
                    //[TODO]Incoming Call handler in UI -> Send Local Video Option to be aded later
                    //[TODO]change video to true when testing across different machines
                    navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(mediaReady).catch(mediaFail)
                    break
                default:
                    console.error('Invalid Call Params -> ', callParams)
                    break
            }


            console.info('getUserMedia Called')
        })
    }

    function sigHandlerExport() {

        return function (msg) {
            let remoteMsg = msg.message

            switch (remoteMsg.type) {

                case 'sdp':
                    let sdpMsg = remoteMsg.message

                    switch (sdpMsg.type) {
                        case 'offer':
                            targetEmailID = signallingChannel.setTarget(msg.from)
                            console.info('SDP Offer Message->', sdpMsg.type)
                            call({ type: 'incomingCall', sdp: sdpMsg })
                            break
                        case 'answer':
                            console.info('SDP Answer Message->', sdpMsg.type)
                            if (pc.signalingState != 'stable') pc.setRemoteDescription(sdpMsg)
                                .catch(function (err) { console.error('Error during answerSDP to pcRemote ', err) })
                            break
                        default:
                            console.error('Unknown SDP Message->', sdpMsg)
                            break
                    }
                    break

                case 'ice':
                    console.info('ICE Message->', remoteMsg.iceMsg.sdpMid)
                    pc.addIceCandidate(new window.RTCIceCandidate(remoteMsg.iceMsg))
                        .catch(function (err) { console.error('Error while addICE ', err) })
                    break

                default:
                    console.error('Unknown Message->', remoteMsg)
                    break
            }
        }
    }

    return { call, sigHandlerExport }
}