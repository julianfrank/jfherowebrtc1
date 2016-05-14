let log

window.onload = function () {

    //Update this as per need
    let debugText = '', debugUpdateScreen = true, debugBuffer = 4444, debugRefreshDelay = 44, DISPLAYDEBUGLOG = true

    //Core Lod Update Function
    log = function (msg) {
        console.log(msg)
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

    //This inserts the log into the body
    if (DISPLAYDEBUGLOG) {
        if (!document.getElementById('debugConsole')) {
            let debugView = document.createElement("article")
            debugView.setAttribute('draggable', true)

            var debugViewStyle = document.createElement('style')
            debugView.className = 'debugConsole'
            debugViewStyle.innerHTML = ".debugConsole{width:25em;height:7em;position:absolute;bottom:1%;left:1%;z-index:111;max-height:44vh;color: white;opacity:0.16;background-color: black;overflow: visible;border-radius:7px;border-width:2px;border-color:black;border-style:solid;box-sizing:border-box}\n"
            debugViewStyle.innerHTML += ".debugConsole:hover{width:100%;height:100%;max-width:78%;overflow: auto;opacity:1;animation: mymove 1s infinite;animation-direction: alternate;}\n"
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

