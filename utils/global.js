var _isDebugMode = false;

function setDebug(__isDebuMode) {
    _isDebugMode = __isDebuMode;
}

function getDebug() {
    return _isDebugMode;
}

module.exports = {
    setIsDebugMode: setDebug,
    isDebugMode: getDebug
};