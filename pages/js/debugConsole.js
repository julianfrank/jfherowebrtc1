let debugText = "",
debugUpdateScreen = true,
debugBuffer = 10000,
debugRefreshDelay=100


function log(msg) {
    debugText = msg + '\n' + debugText
    debugText = debugText.slice(0, debugBuffer)
    if (debugUpdateScreen) {
        $('#debugConsole').text(debugText)
        debugUpdateScreen = false
        setTimeout(function () {
            debugUpdateScreen = true
        }, debugRefreshDelay);
    }
}