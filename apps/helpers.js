'use strict'
// Import key Libraries
var crypto = require('crypto')
var fs = require('fs')
var https = require('https')
var os = require('os')

var winston = require('winston');
require('winston-loggly');
winston.add(winston.transports.Loggly, {
    token: "4beae9b4-3dd4-4bed-b730-be16fb624988",
    subdomain: "lab4jf",
    tags: ['JF'],
    json: true
})
//Winston logging levels { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }

/* Change this to change the logging method of the app
@logText    String  Text to be logged with a timestamp
*/
function log(logText) {
    var date = (typeof process.env.NODE_HOME === "undefined") ? Date().substring(16, 24) + '| ' : 'JF>'
    console.log(date + logText)
}

/* Change this to change the logging method of the app
@jsFile    String  Name of the file from which this instance will work
*/
function loggly() { return winston.log }

/* Supposed to be used in winstron-loggly command to confirm log status
@err    String  Error
@result String  Result sent by Loggly
*/
function checkLog(err, result) {
    if (err) {
        console.error('loggly\t:Logging resulted in err -> ' + err)
    } else {
        console.error('loggly\t:Logging Successful with result -> ' + result)
    }
}

/*Pulls the details of the network interfaces connected to the Node-Server in an Array
*/
function getHostNetworkInterfaces() {
    var networkInterfaces = os.networkInterfaces()
    return networkInterfaces
}

/*Generate a Hashed String that stays the same only for one hour
@mySecret 	String 	Any String that remains constant between creation and checking time/entity
*/
function hourlyState(mySecret) {
    var shasum = crypto.createHash('sha1')
    shasum.update(mySecret + Date().substring(0, 19))
    var hs = shasum.digest('hex').toString()
    return hs
}

/*Return Hour Difference between two Dates
@date1 	Date() 	First Date
@date2 	Date() 	Second Date - dates can be provided in any order but returned value will remain positive
*/
function hourDiff(date1, date2) {
    var diff = (diff < 0) ? (date1 - date2) : -(date1 - date2)
    diff = diff / 1000 / 60 / 60;//1000 milisecs->60 seconds ->60 mins
    return Math.floor(diff)
}

/*Generic function to read file within express engine declaration...currently planned to be used only for HTML
Add this into express using this statement =>	app.engine('html', helpers.readHTML);//This sample gets called when any '.html' file is rendered 
Parameters are called directly by express, so no coding needed*/
function readHTML(filePath, options, callback) {
    fs.readFile(filePath, function (err, content) {
        if (err) return callback(new Error(err.message))
        // this is an extremely simple template engine
        var rendered = content.toString()
        return callback(null, rendered)
    })
}

/*Generic function to reaquest from any https site
@options 	JSON 						Use Standard NodeJS's HTTPS Options JSON Structure
										example =>
                                        {
											method: 'GET',
											hostname: 'host.com',
											path: '/' + this.tenant + '/me?api-version=1.6',
											headers: {
												'Content-Type': 'application/JSON',
												'Authorization': 'Bearer ' + token
												}
										}
@body 		String 						Body of the Request
@callback 	function(response,error) 	CallBack Function to be called when request receives a response
	@response 	JSON 	response received as a JSON Object
	@error 		Error 	Error if any  
*/
function requestHTTPS(options, body, callback) {
    var response = '';
    var req = https.request(options, function (x) {
        //log.info("helpers.requestHTTPS: \nstatusCode: ", x.statusCode, "\nheaders: ", x.headers);
        x.setEncoding('utf8');
        x.on('data', function (d) { response += d; })
        x.on('end', function () {
            if ((response === null) || (response.length === 0)) {
                options = JSON.stringify(options); body = JSON.stringify(body)
                //		log.fatal("\nhelpers.requestHTTPS:=> Fatal Error while calling with \n Options: " + options + "\nBody: " + body + '\n');
                callback(null, "helpers.requestHTTPS:=><br>Fatal Error while calling with <br> Options: " + options + "<br>Body: " + body + "<br>Returned StatusCode: " + x.statusCode + "<br>Returned Headers: " + x.rawHeaders + "<br>Returned Trailers: " + x.rawTrailers)
                return
            } else {//No Error so just return the response
                response = JSON.parse(response);
                callback(response, null);
                return;
            }
        });
    });
    if (body != undefined) req.write(body);
    req.end();
    req.on('error', function (e) {
        //log.fatal("\nhelpers.requestHTTPS: Fatal Error while calling with \n Options:" + options + "\nBody:" + body + "\nError Details:" + e + '\n');
        callback(null, "helpers.requestHTTPS: Fatal Error while calling with \n Options:" + options + "\nBody:" + body + "\nError Details:" + e);
    });
}

/*Read Variables in package.json
@variable 	String 	Top level string to be read from 'PAckage.JSON' file*/
function readPackageJSON(pkgDir, variable) {
    var packageJSON = require('../package.json')
    return packageJSON[variable];
}

/*Return a clean array with only the specific JSON field you need
This is specifically meant for Arrays of Jsons and requirement is for a new array with just one field from the entire jason object
@array 	Array/[] 	Source Array of JSONs
@field 	String 		Name of the Field that is required*/
function cleanArray(array, field) {
    var cleanA = [];
    array.forEach(function (value, index, array) {
        cleanA.push(value[field]);
    })
    return cleanA;
}

module.exports = {
    log,
    loggly,
    checkLog,
    getHostNetworkInterfaces,
    hourlyState,
    hourDiff,
    readHTML,
    requestHTTPS,
    readPackageJSON,
    cleanArray
}