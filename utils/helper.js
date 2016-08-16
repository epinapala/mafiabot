/*jshint esnext : true*/

var shuffle = require('shuffle-array');

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

module.exports = {
	shuffle : shuffle,//use shuffle-array module's shuffle for now.
    formatUptime: formatUptime,
    getUserPreferredName : getUserPreferredName
};