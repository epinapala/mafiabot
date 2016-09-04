/*jshint esnext : true*/

const shuffle = require('shuffle-array');
const _ = require('underscore');
const constants = require('../lib/constants');
const ROLE_MANDATORY = constants.ROLE_MANDATORY;
const ROLE_OPTIONAL = constants.ROLE_OPTIONAL;
const ROLE_CATEGORY_SPLIT_DELIMITER = '|';
const ROLE_SEPERATOR = ',';
const ROLE_COUNT_SEPERATOR = ':';

function formatUptime(uptime) {
    let unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}

function getUserPreferredName(user) {
    if (user.profile && user.profile.first_name) {
        return user.profile.first_name.trim();
    } else if (user.name) {
        return user.name;
    } else {
        return user.id;
    }
}

function splitAndTrimByCharacter(input, char) {
    return input.split(char) // split by comma
        .map( // trim each role
        Function.prototype.call, String.prototype.trim);
}

function getCommaSeperatedRolesFromCustomFormat(input) {
    let allRolesInputArray = splitAndTrimByCharacter(input, ROLE_CATEGORY_SPLIT_DELIMITER);
    let customMandatoryRoleArray = splitAndTrimByCharacter(allRolesInputArray[0], ROLE_SEPERATOR);
    let customOptionalRoleArray = splitAndTrimByCharacter(allRolesInputArray[1], ROLE_SEPERATOR);
    return {
        [ROLE_MANDATORY] : fillRolesByRoleCount(customMandatoryRoleArray, ROLE_MANDATORY),
        [ROLE_OPTIONAL] : fillRolesByRoleCount(customOptionalRoleArray, ROLE_OPTIONAL)
    };
}

function fillRolesByRoleCount(roleArray, roleType) {
    let roles = [];
    _.each(roleArray, function (item, index) {
        let numOfColons = item.match(/:/g).length;
        if (numOfColons === 1) {
            let itemArr = splitAndTrimByCharacter(item, ROLE_COUNT_SEPERATOR);
            let curRoles = fillArray(itemArr[0], parseInt(itemArr[1]));
            roles.push(curRoles);
        } else {
            console.log('Skipping malformed item -' + item);
        }
    });
    return _.flatten(roles);//flatten array of arrays to a single array
}

function fillArray(elementToRepeat, repeatTimes) {
    return Array.apply(null, Array(repeatTimes)).map(function () { return elementToRepeat; });
}

function getComputedRoleResult(roles, userCount){
        let roleInput = roles[ROLE_MANDATORY];// take mandatory roles as is.
        if(roleInput.length >= user_count){
          convo.say('# of mandatory roles are equal or greater then the number of users in the channel, optional roles, if any will be ignored');
          //TODO should we compute roled form just mandatory roles? or warn/halt?
        }else{
          //TODO mandatory role count is less than user count, use all mandatory roles and fill the rest with optional roles.
        }
}

module.exports = {
    fillArray: fillArray,
    formatUptime: formatUptime,
    getCommaSeperatedRolesFromCustomFormat: getCommaSeperatedRolesFromCustomFormat,
    getComputedRoleResult : getComputedRoleResult,
    getUserPreferredName: getUserPreferredName,
    shuffle: shuffle,//use shuffle-array module's shuffle for now.
    splitAndTrimByCharacter: splitAndTrimByCharacter
};