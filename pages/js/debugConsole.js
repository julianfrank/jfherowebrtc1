let debugText = "",
    debugUpdateScreen = true,
    debugBuffer = 4444,
    debugRefreshDelay = 444

window.onload = function () {
    if (!document.getElementById('debugConsole')) {
        let debugView = document.createElement("article")
        debugView.appendChild(document.createTextNode("Debug View"))
        debugView.className = 'supressed'
        let debugPre = document.createElement("pre")
        debugPre.id = 'debugConsole'
        debugView.appendChild(debugPre)
        let body = document.getElementsByTagName("body")[0].appendChild(debugView)
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