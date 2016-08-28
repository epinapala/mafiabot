var _isDebugMode = false;
var _users = [];
var rw;

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

function getRandomWord(){
    if(!rw){
        generateRandomWord();
    }
    return rw;
}

function generateRandomWord(){
    rw = require('random-words')();
}

module.exports = {
    setIsDebugMode: setDebug,
    isDebugMode: getDebug,
    getUsers: getUsers,
    setUsers: setUsers,
    getRandomWord: getRandomWord,
    generateRandomWord: generateRandomWord
};