/** jshint esnext: true */

var globalUtil = require('../utils/global');
var _Promise = require('bluebird');
var isDebug = false;
var rw =  '['+  require('random-words')()  + '] > ';

function messageUser(bot, user) {
    if (globalUtil.isDebugMode()) {
        return new _Promise(function (resolve, reject) {
            console.log('[Debug] Hi there ' + user.preferred_name + '! Your role is : ' + user.role);
            resolve('[Debug] Sent PM to user.');
        });
    } else {
        return new _Promise(function (resolve, reject) {
            var role = user.role;
            bot.api.chat.postMessage({
                channel: user.id,
                text: rw + 'Hi there ' + user.preferred_name + '! Your role is : ' + role + '\n' + '-=-=-=-=-==-=-=-=-=-=--=-=-=',
                username: 'mafia-bot',
                as_user: true
            }, function (err, response) {
                if (err) {
                    reject('Unable to reveal role to user : ' + user.preferred_name + '. Error : ' + err);
                } {
                    resolve('Revealed role to user : ' + user.preferred_name + ' : ' + role + ' via DM');
                }
            });
        });
    }
}

function messageGameNameToOrganizer(convo){
  return messageOrganizer('Game name is ' + rw, convo);
}

function messageUserRoleToOrganizer(user, convo) {
    var message = rw + user.preferred_name + '\'s role is : ' + user.role;
    return messageOrganizer(message, convo);
}

function messageOrganizer(message, convo) {
    return new _Promise(function (resolve, reject) {
        convo.say(message);
        resolve(message);
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

function initializeBotRtm(bot) {
    return new _Promise(function (resolve, reject) {
        bot.startRTM(function (err, bot, payload) {
            if (err) {
                //halt here if bot couldnt connect to slack.
                throw new Error('Darn! Could not connect to slack!' + JSON.stringify(err));
            } else {
                console.log('Connected to Slack RTM!');
                resolve();
            }
        });
    });
}

module.exports = {
    initializeBotRtm: initializeBotRtm,
    retreiveAllGroups: retreiveAllGroups,
    retreiveUserInfo: retreiveUserInfo,
    messageUser: messageUser,
    messageOrganizer: messageOrganizer,
    messageUserRoleToOrganizer : messageUserRoleToOrganizer,
    messageGameNameToOrganizer : messageGameNameToOrganizer
};
