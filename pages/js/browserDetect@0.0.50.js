/**
 * Extract browser version out of the provided user agent string.
 *
 * @param {!string} uastring userAgent string.
 * @param {!string} expr Regular expression used as match criteria.
 * @param {!number} pos position in the version string to be returned.
 * @return {!number} browser version.
 */
function extractVersion(uastring, expr, pos) {
    var match = uastring.match(expr);
    return match && match.length >= pos && parseInt(match[pos], 10);
}

/**
 * Browser detector.
 *
 * @return {object} result containing browser, version and minVersion
 *     properties.
 */
function detectBrowser() {
    // Returned result object.
    var result = {};
    result.browser = null;
    result.version = null;
    result.minVersion = null;

    // Fail early if it's not a browser
    if (typeof window === 'undefined' || !window.navigator) {
        result.browser = 'Not a browser.';
        return result;
    }

    // Firefox.
    if (navigator.mozGetUserMedia) {
        result.browser = 'firefox';
        result.version = extractVersion(navigator.userAgent,
            /Firefox\/([0-9]+)\./, 1);
        result.minVersion = 31;

        // all webkit-based browsers
    } else if (navigator.webkitGetUserMedia) {
        // Chrome, Chromium, Webview, Opera, all use the chrome shim for now
        if (window.webkitRTCPeerConnection) {
            result.browser = 'chrome';
            result.version = extractVersion(navigator.userAgent,
                /Chrom(e|ium)\/([0-9]+)\./, 2);
            result.minVersion = 38;

            // Safari or unknown webkit-based
            // for the time being Safari has support for MediaStreams but not webRTC
        } else {
            // Safari UA substrings of interest for reference:
            // - webkit version:           AppleWebKit/602.1.25 (also used in Op,Cr)
            // - safari UI version:        Version/9.0.3 (unique to Safari)
            // - safari UI webkit version: Safari/601.4.4 (also used in Op,Cr)
            //
            // if the webkit version and safari UI webkit versions are equals,
            // ... this is a stable version.
            //
            // only the internal webkit version is important today to know if
            // media streams are supported
            //
            if (navigator.userAgent.match(/Version\/(\d+).(\d+)/)) {
                result.browser = 'safari';
                result.version = extractVersion(navigator.userAgent,
                    /AppleWebKit\/([0-9]+)\./, 1);
                result.minVersion = 602;

                // unknown webkit-based browser
            } else {
                result.browser = 'Unsupported webkit-based browser ' +
                    'with GUM support but no WebRTC support.';
                return result;
            }
        }

        // Edge.
    } else if (navigator.mediaDevices &&
        navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) {
        result.browser = 'edge';
        result.version = extractVersion(navigator.userAgent,
            /Edge\/(\d+).(\d+)$/, 2);
        result.minVersion = 10547;

        // Default fallthrough: not supported.
    } else {
        result.browser = 'Not a supported browser.';
        return result;
    }

    // Warn if version is less than minVersion.
    if (result.version < result.minVersion) {
        utils.log('Browser: ' + result.browser + ' Version: ' + result.version +
            ' < minimum supported version: ' + result.minVersion +
            '\n some things might not work!');
    }

    return result;
}