let pnShared, pnUser, privChannel

$(document).ready(() => {
    //Declare all the functions
    function whoami(next) {
        $.ajax({ url: '/whoami', dataType: 'text' })
            .done((data) => { return next(data) })
    }

    function initPubNub(uuid) {
        return PUBNUB.init({
            publish_key: 'pub-c-d2da6931-2a1d-4fb9-a9e9-d7f4b19e08b4',
            subscribe_key: 'sub-c-4336477c-e46f-11e5-b584-02ee2ddab7fe',
            ssl: true,
            uuid: uuid,
            error: function (error) {
                log(uuid + ' PubNub Error:', error);
            }
        })
    }

    //Start the Application Code Here
    whoami((userEmail) => {

        pnUser = initPubNub(userEmail)

        pnUser.subscribe({
            channel: 'shared',
            message: function (message, env, channel) {
                // RECEIVED A MESSAGE.
                log('Received:\t' + message + '\tenv:\t' + env + '\tchannel:\t' + channel)
            },
            connect: function () {
                log("Connected")
            },
            disconnect: function () {
                log("Disconnected")
            },
            reconnect: function () {
                log("Reconnected")
            },
            error: function () {
                log("Network Error")
            },
        })

        setInterval(function () {
            pnUser.publish({
                channel: 'shared',
                message: 'Testing message from ' + userEmail,
                callback: function (m) { log(m) }
            })
        }, Math.random()*100)

    })

})