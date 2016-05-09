let pnShared, pnUser, privChannel

$(document).ready(() => {
    //Declare all the functions
    function whoami(next) {
        $.ajax({ url: '/whoami', dataType: 'text' })
            .done((data) => { return next(data) })
    }

    function initPubNub() {
        return PUBNUB.init({
            publish_key: 'pub-c-d2da6931-2a1d-4fb9-a9e9-d7f4b19e08b4',
            subscribe_key: 'sub-c-4336477c-e46f-11e5-b584-02ee2ddab7fe',
            ssl: true,
            error: function (error) {
                log(uuid + ' PubNub Error:', error);
            }
        })
    }

    function subscribePubNub(pubnub, channel, msgHandler) {
        pubnub.uuid(function (uuid) {
            pubnub.subscribe({
                channel: channel,
                message: function (message, env, channel) { return msgHandler(message, env, channel, uuid) },
                connect: function () { log("Connected") },
                disconnect: function () { log("Disconnected") },
                reconnect: function () { log("Reconnected") },
                error: function () { log("Network Error") },
            })
        })
    }

    function stdMsgHandler(message, env, channel, uuid) { log(uuid + ' Received:\t' + message + '\tenv:\t' + env + '\tchannel:\t' + channel) }

    //Start the Application Code Here
    whoami((userEmail) => {

        pnUser = initPubNub(userEmail)
        subscribePubNub(pnUser, 'shared', stdMsgHandler)

        setInterval(function () {
            pnUser.publish({
                channel: 'shared',
                message: 'Testing msg from ' + userEmail,
                callback: function (m) { log('Publishing with status: '+m) }
            })
        }, 1000 + (Math.random() * 10000))

    })

})