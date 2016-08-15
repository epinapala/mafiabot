/** jshint esnext: true */

var globalUtil = require('../utils/global');
var _Promise = require('bluebird');
var isDebug = false;

function messageUser(user) {
    if (globalUtil.isDebugMode()) {
        return new _Promise(function (resolve, reject) {
            console.log('[Debug] Hi there ' + user.preferred_name + '! Your role is : ' + user.role);
            resolve('[Debug] Sent PM to user.');
        });
    } else {
        return new _Promise(function (resolve, reject) {
            bot.api.chat.postMessage({
                channel: user.id,
                text: 'Hi there ' + user.preferred_name + '! Your role is : ' + user.role,
                username: 'mafia-bot',
                as_user: true
            }, function (err, response) {
                if (err) {
                    reject('Unable to reveal role to user : ' + user.preferred_name + '. Error : ' + err);
                } {
                    resolve('Revealed role to user : ' + user.preferred_name + ' : ' + user.role + ' via DM');
                }
            });
        });
    }
}

function messageOrganizer(user, convo) {
    return new _Promise(function (resolve, reject) {
        var privateMessage = user.preferred_name + '\'s role is : ' + user.role;
        convo.say(privateMessage);
        resolve(privateMessage);
    });
}

module.exports = {
    messageUser: messageUser,
    messageOrganizer: messageOrganizer
};