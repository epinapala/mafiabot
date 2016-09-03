/*jshint esnext : true*/

const shuffle = require('shuffle-array');
const _ = require('underscore');
const ROLE_MANDATORY = 'role_mandatory';
const ROLE_OPTIONAL = 'role_optional';

function formatUptime(uptime) {
    var unit = 'second';
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
    let allRolesInputArray = splitAndTrimByCharacter(input, '|');
    let customMandatoryRoleArray = splitAndTrimByCharacter(allRolesInputArray[0], ',');
    let customOptionalRoleArray = splitAndTrimByCharacter(allRolesInputArray[1], ',');
    let roles = [];

    roles.concat(fillRolesByRoleCount(customMandatoryRoleArray), ROLE_MANDATORY);
    roles.concat(fillRolesByRoleCount(customOptionalRoleArray), ROLE_OPTIONAL);

    return roles.join();
}

function fillRolesByRoleCount(roleArray, roleType) {
    var roles = [];
    _.each(roleArray, function (item, index) {
        var numOfColons = item.match(/:/g).length;
        if (numOfColons === 1) {
            var itemArr = splitAndTrimByCharacter(item, ':');
            roles.push(fillArray(itemArr[0], parseInt(itemArr[1])));
        } else {
            console.log('Skipping malformed item :' + item);
        }
    });
    return roles;
}

function fillArray(elementToRepeat, repeatTimes) {
    return Array.apply(null, Array(repeatTimes)).map(function () { return elementToRepeat; });
}

module.exports = {
    fillArray: fillArray,
    formatUptime: formatUptime,
    getCommaSeperatedRolesFromCustomFormat: getCommaSeperatedRolesFromCustomFormat,
    getUserPreferredName: getUserPreferredName,
    shuffle: shuffle,//use shuffle-array module's shuffle for now.
    splitAndTrimByCharacter: splitAndTrimByCharacter
};