let debugText = ""
function log(msg) {
    debugText = debugText + '\n' + msg
    debugText = debugText.slice(debugText.length - 4000)
    $('#debugConsole').text(debugText)
}