let debugText = "",
    debugUpdateScreen = true,
    debugBuffer = 4444,
    debugRefreshDelay = 44,
    DISPLAYDEBUGLOG = true

window.onload = function () {
    if (DISPLAYDEBUGLOG) {
        if (!document.getElementById('debugConsole')) {
            let debugView = document.createElement("article")

            var debugViewStyle = document.createElement('style')
            debugView.className = 'supressed'
            debugViewStyle.innerHTML = ".supressed{max-width:78%;position:fixed;bottom:1%;right:1%;max-height:44vh;color: white;opacity:0.4;background-color: black;overflow: auto;}\n"
            debugViewStyle.innerHTML += ".supressed:hover{opacity:0.9;animation: mymove 1s infinite;animation-direction: alternate;}\n"
            debugViewStyle.innerHTML += "@keyframes mymove {100% {box-shadow: 0px 0px 7px 7px darkgrey;}}"
            debugView.appendChild(debugViewStyle)

            let debugPre = document.createElement("pre")
            debugPre.id = 'debugConsole'
            debugView.appendChild(debugPre)

            let body = document.getElementsByTagName("body")[0].appendChild(debugView)

            log('Julian Frank says:\t Your Debug Console is now Ready')
        } else {
            log('Julian Frank says:\t Your Debug Console was Ready')
        }
    }
}

function log(msg) {
    if (DISPLAYDEBUGLOG) {
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
}