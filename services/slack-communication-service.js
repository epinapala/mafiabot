/** jshint esnext: true */

var globalUtil = require('../utils/global');
var _Promise = require('bluebird');
var isDebug = false;

function messageUser(bot, user) {
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

function retreiveAllGroups(bot, current_group_id) {
    return new _Promise(function (resolve, reject) {
        bot.api.groups.list({
            group: current_group_id
        }, function (err, response) {
            if (err) {
                var err_msg = 'Unable to extract Group info : ' + current_group_id;
                bot.reply(message, err_msg);
                reject(err_msg);
            } else {
                resolve(response.groups);
            }
        });
    });
}

function retreiveUserInfo(bot, user_id) {
    return new _Promise(function (resolve, reject) {
        bot.api.users.info({
            user: user_id
        }, function (err, user_data) {
            if (err) {
                reject('Unable to retreive user, Error : ' + err);
            } else {
                resolve(user_data.user);
            }
        });
    });
}

module.exports = {
    retreiveAllGroups: retreiveAllGroups,
    retreiveUserInfo: retreiveUserInfo,
    messageUser: messageUser,
    messageOrganizer: messageOrganizer
};