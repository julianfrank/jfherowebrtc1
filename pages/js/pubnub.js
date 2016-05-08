$(document).ready(() => {

    function whoami(next) {
        $.ajax({ url: '/whoami', dataType: 'text' })
            .done((data) => { return next(data) })
    }

    function initPubNub() {
        return PUBNUB.init({
            publish_key: 'pub-c-d2da6931-2a1d-4fb9-a9e9-d7f4b19e08b4',
            subscribe_key: 'sub-c-4336477c-e46f-11e5-b584-02ee2ddab7fe',
            error: function (error) {
                console.error('PubNub Error:', error);
            }
        })
    }

    let pubnub = initPubNub()
    let privChannel = ''
    pubnub.time((message) => {
        whoami((userEmail) => {

            privChannel = 'wrtc' + userEmail

            pubnub.subscribe({
                channel: 'wrtcCommon',
                message: function (m) {
                    console.log("Message from channel wrtcCommon->" + m)
                },
                error: function (error) { console.error("Error in wrtcCommon " + JSON.stringify(error)) }
            })
            pubnub.publish({
                channel: 'wrtcCommon',
                message: userEmail,
                callback: function (m) {
                    console.log("wrtcCommon Publish status -> " + m)
                }
            })

            pubnub.subscribe({
                channel: privChannel,
                message: function (m) {
                    console.log("Message from channel " + privChannel + " ->" + m)
                },
                error: function (error) { console.error("Error in " + privChannel + "-> " + JSON.stringify(error)) }
            })
            pubnub.publish({
                channel: privChannel,
                message: userEmail,
                callback: function (m) {
                    console.log(privChannel + " Publish status -> " + m)
                }
            })
        })
    })

})