var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(80);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    socket.on('b2n', function (data) {
        //        socket.emit('n2b', { msg: data.msg })
        console.log('Received %s from Browser', data.msg)
        client2.publish("jfsobridge", data.msg, redis.print);
    })

    var redis = require("redis"),
        client1 = redis.createClient(14190, 'pub-redis-14190.us-central1-1-1.gce.garantiadata.com', { no_ready_check: false }),
        client2 = redis.createClient(14190, 'pub-redis-14190.us-central1-1-1.gce.garantiadata.com', { no_ready_check: false }),
        msg_count = 0
    client1.auth('redisPASS', function (err) { if (err) throw err })
    client2.auth('redisPASS', function (err) { if (err) throw err })

    client1.on("message", function (channel, message) {
        console.log("Client1 channel message received " + channel + ": " + message);
        if (typeof socket != 'undefined') socket.emit('n2b', { msg: message })
        msg_count += 1;
        if (msg_count === 11) {
            client1.unsubscribe();
            client1.end();
            client2.end();
        }
    }, redis.print);

    client1.on("subscribe", function (channel, count) {
        client2.publish("jfsobridge", "Client 1 has subscribed and message received", redis.print);
    }, redis.print)

    client1.subscribe("jfsobridge", function () {
        console.log("Client1 Subscribed")
    });
});



var monclient = require("redis").createClient(14190, 'pub-redis-14190.us-central1-1-1.gce.garantiadata.com', { no_ready_check: false }),
    util = require("util");
monclient.auth('redisPASS', function (err) { if (err) throw err })
monclient.monitor(function (err, res) { console.log("Entering monitoring mode.") })
monclient.on("monitor", function (time, args) { console.log(time + ": " + util.inspect(args)) })