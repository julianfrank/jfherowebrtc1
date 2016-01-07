'use strict'

var app = require('express')();

app.get('/', function (req, res) {
    res.send('Working')
})

var port = process.env.PORT || 8080
app.listen(port, function () {
    console.log('Listening on port : ' + port)
})