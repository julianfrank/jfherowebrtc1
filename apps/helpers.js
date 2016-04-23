'use strict'
// Import key Libraries
const crypto = require('crypto')
const fs = require('fs')
const https = require('https')
const os = require('os')

const winston = require('winston')

//Papertrail based logging
const Papertrail = require('winston-papertrail').Papertrail
const consoleLogger = new winston.transports.Console({ colorize: true, inlineMeta: false, level: 'info' })
const ptLogger = new Papertrail({
    host: 'logs4.papertrailapp.com', port: 17201,
    colorize: true, inlineMeta: true, level: 'debug'
})
let logger = new winston.Logger({ transports: [consoleLogger, ptLogger] })
const consoleopts = ['error', 'warn', 'info', 'debug']
consoleopts.forEach((val) => { return remoteLog(val, 'Testing ' + val, { test: val }) })
/* Change this to change the logging method of the app
@type       String  Type of message. Accepted values are info,error, warn and debug
@message    String  Message to be sent to Logger
@meta       JSON    Meta data to be sent along with the message
*/
function remoteLog(type, message, meta) {
    if (type === 'error') { return logger.error(message, meta, checkLog) }
    if (type === 'warn') { return logger.warn(message, meta, checkLog) }
    if (type === 'debug') { return logger.debug(message, meta, checkLog) }
    if (type === 'info') { return logger.info(message, meta, checkLog) }
    logger.error('Unhandled log type ' + type + ' message ' + message + ' meta ' + JSON.stringify(meta))
}
/* Supposed to be used in winstron-loggly command to confirm log status
@err    String  Error
@result String  Result sent by Loggly*/
function checkLog(err, result) {
    if (err) {
        logger.error('RemoteLog\t:Logging resulted in err -> ' + err)
    } else {
        //logger.debug('RemoteLog\t:Logging Successful with result -> ' + result)//Enable to test the logger
    }
}

/* Change this to change the console.log logging method of the app
@logText    String  Text to be logged with a timestamp
*/
function log(logText) {
    let date = (typeof process.env.NODE_HOME === "undefined") ? Date().substring(16, 24) + '| ' : 'JF>'
    console.log(date + logText)
}

/*Pulls the details of the network interfaces connected to the Node-Server in an Array
*/
function getHostNetworkInterfaces() {
    let networkInterfaces = os.networkInterfaces()
    return networkInterfaces
}

/*Generate a Hashed String that stays the same only for one hour
@mySecret 	String 	Any String that remains constant between creation and checking time/entity
*/
function hourlyState(mySecret) {
    let shasum = crypto.createHash('sha1')
    shasum.update(mySecret + Date().substring(0, 19))
    let hs = shasum.digest('hex').toString()
    return hs
}

/*Return Hour Difference between two Dates
@date1 	Date() 	First Date
@date2 	Date() 	Second Date - dates can be provided in any order but returned value will remain positive
*/
function hourDiff(date1, date2) {
    let diff = (diff < 0) ? (date1 - date2) : -(date1 - date2)
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
        let rendered = content.toString()
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
    let response = '';
    let req = https.request(options, function (x) {
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

/*Read letiables in package.json
@letiable 	String 	Top level string to be read from 'PAckage.JSON' file*/
function readPackageJSON(pkgDir, letiable) {
    let packageJSON = require('../package.json')
    return packageJSON[letiable];
}

/*Return a clean array with only the specific JSON field you need
This is specifically meant for Arrays of Jsons and requirement is for a new array with just one field from the entire jason object
@array 	Array/[] 	Source Array of JSONs
@field 	String 		Name of the Field that is required*/
function cleanArray(array, field) {
    let cleanA = [];
    array.forEach(function (value, index, array) {
        cleanA.push(value[field]);
    })
    return cleanA;
}

module.exports = {
    log,
    remoteLog,
    //checkLog,
    getHostNetworkInterfaces,
    hourlyState,
    hourDiff,
    readHTML,
    requestHTTPS,
    readPackageJSON,
    cleanArray
}
