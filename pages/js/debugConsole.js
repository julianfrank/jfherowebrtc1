let debugText = "",
    debugUpdateScreen = true,
    debugBuffer = 4444,
    debugRefreshDelay = 44

window.onload = function () {
    if (!document.getElementById('debugConsole')) {
        let debugView = document.createElement("article")
        let debugPre = document.createElement("pre")
        debugView.appendChild(debugPre)
        debugView.className = 'supressed'
        let body = document.getElementsByTagName("body")[0].appendChild(debugView)
        debugPre.id = 'debugConsole'
        log('Julian Frank says:\t Your Debug Console is now Ready')
    } else {
        log('Julian Frank says:\t Your Debug Console was Ready')
    }
}

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