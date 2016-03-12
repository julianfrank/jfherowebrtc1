var express = require('express')
app = express()

app.listen(process.env.PORT || 80);

app.use(express.static('public'));

app.get('/', function (req, res) {
    console.info(Date()+ req.path)
    res.sendFile(__dirname + '/greta.html');
})

app.get('/a', function (req, res) {
    console.info(Date()+ req.path)
    res.sendFile(__dirname + '/gretaa.html');
})

app.get('/b', function (req, res) {
    console.info(Date()+ req.path)
    res.sendFile(__dirname + '/gretab.html');
})