var _isDebugMode = false;
var _users = [];

function setDebug(__isDebuMode) {
    _isDebugMode = __isDebuMode;
}

function getDebug() {
    return _isDebugMode;
}

module.exports = {
    setIsDebugMode: setDebug,
    isDebugMode: getDebug,
    getUsers : function(){
        return _users;
    }
};