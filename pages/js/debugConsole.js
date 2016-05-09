let debugText = ""
let debugUpdateScreen = true

function log(msg) {
    debugText = msg + '\n' + debugText
    debugText = debugText.slice(0, 10000)
    if (debugUpdateScreen) {
        $('#debugConsole').text(debugText)
        debugUpdateScreen = false
        setTimeout(function () {
            debugUpdateScreen = true
        }, 2000);
    }
}