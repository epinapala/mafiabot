/*jshint expr: true, node: true, esnext : true*/

'use strict';

const shuffle = require('shuffle-array');
const _ = require('underscore');
const constants = require('../lib/constants');
const ROLE_MANDATORY = constants.ROLE_MANDATORY;
const ROLE_OPTIONAL = constants.ROLE_OPTIONAL;
const ROLE_CATEGORY_SEPERATOR = constants.ROLE_CATEGORY_SEPERATOR;
const ROLE_SEPERATOR = constants.ROLE_SEPERATOR;
const ROLE_COUNT_SEPERATOR = constants.ROLE_COUNT_SEPERATOR;

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
    if (!input || !char) {
        return input;
    }
    return input.split(char) // split by comma
        .map( // trim each role
        Function.prototype.call, String.prototype.trim);
}

function getCommaSeperatedRolesFromCustomFormat(input) {
    console.log(input);
    let allRolesInputArray = splitAndTrimByCharacter(input, ROLE_CATEGORY_SEPERATOR);
    let customMandatoryRoleArray = splitAndTrimByCharacter(allRolesInputArray[0], ROLE_SEPERATOR);
    let customOptionalRoleArray = splitAndTrimByCharacter(allRolesInputArray[1], ROLE_SEPERATOR);

    return {
        [ROLE_MANDATORY]: fillRolesByRoleCount(customMandatoryRoleArray, ROLE_MANDATORY),
        [ROLE_OPTIONAL]: fillRolesByRoleCount(customOptionalRoleArray, ROLE_OPTIONAL)
    };
}

function fillRolesByRoleCount(roleArray, roleType) {
    let roles = [];
    _.each(roleArray, function (item, index) {
        let colonMatches = item.match(new RegExp(ROLE_COUNT_SEPERATOR, "g"));
        if (colonMatches && colonMatches.length === 1) {
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

function getComputedRoleResult(roles, userCount) {
    if (userCount === 0) {
        throw new Error('No users found. Cannot generate roles.');
    } else {
        let finalRoles = roles[ROLE_MANDATORY]; // take mandatory roles as is.
        if (finalRoles.length < userCount) {
            if ((finalRoles.length + roles[ROLE_OPTIONAL].length) >= userCount) {
                // Add optional roles if needed
                finalRoles = finalRoles.concat(
                    // shuffle and get the remaining roles,
                    // remaining = requestsed (userCount) <MINUS> already filled (finalRoles.length)
                    shuffle(roles[ROLE_OPTIONAL]).slice(0, userCount - finalRoles.length)
                );
            } else {
                throw new Error('Total Number of roles[' + (finalRoles.length + roles[ROLE_OPTIONAL].length) + '] possible doesnt match the number of users[' +
                    userCount + '] in this channel. Retry with start command');
            }
        } else if (finalRoles.length === userCount) {
            //If mandatory roles equals usercount, then just return mandatory roles === to userCount.
            return finalRoles;
        } else {
            //If mandatory roles are more than required, then shuffle and return mandatory roles === to userCount.
            return (shuffle(finalRoles)).slice(0, userCount);
        }
        return finalRoles;
    }
}

module.exports = {
    fillArray: fillArray,
    formatUptime: formatUptime,
    getCommaSeperatedRolesFromCustomFormat: getCommaSeperatedRolesFromCustomFormat,
    getComputedRoleResult: getComputedRoleResult,
    getUserPreferredName: getUserPreferredName,
    shuffle: shuffle,//use shuffle-array module's shuffle for now.
    splitAndTrimByCharacter: splitAndTrimByCharacter
};