var _isDebugMode = false;
var _users = [];

function setDebug(__isDebuMode) {
    _isDebugMode = __isDebuMode;
}

function getDebug() {
    return _isDebugMode;
}

function getUsers() {
    return _users;
}

function setUsers(users) {
    _users = users;
}

module.exports = {
    setIsDebugMode: setDebug,
    isDebugMode: getDebug,
    getUsers: getUsers,
    setUsers: setUsers
};