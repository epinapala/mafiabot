var Botkit = require('botkit');
var _ = require('underscore');

var controller = Botkit.slackbot({
  json_file_store: './storage'
});

var bot = controller.spawn({
  token: "xoxb-8526921072-OVtelBhvHrrmEvDPPC9EIDHQ"
})

bot.startRTM(function (err, bot, payload) {
  if (err) {
    throw new Error('Darn! Could not connect to slack!' + JSON.stringify(err));
  }
});

controller.hears(["="], ["direct_message", "direct_mention", "mention", "ambient"], function (bot, message) {
  bot.api.channels.list({ channel: message.channel }, function (err, response) {
    var current_channel_id = message.channel;
    if (err) {
      bot.reply(message, "Unable to extract channel info : " + current_channel_id);
    } else {
      var channels = response.channels;
      if (channels) {
        var channel = _.find(channels, function (object) {
          return object.id === current_channel_id
        });
        bot.reply(message, "Channel name is : " + channel.name);
        var users = channel.members || [];
        _.each(users, function (id) {
          bot.api.users.info({ user: id }, function (err, user_data) {
            var user = user_data.user;
            if (err) {
              bot.reply(message, "Unable to find user : " + id);
            } else {
              bot.reply(message, user.name);
            }
          });
          /*
           
          */
        });
      } else {
        bot.reply(message, 'No channels returned from slack :(');
      }
    }
  });
});

controller.hears(["=start"], ["direct_message", "direct_mention", "mention", "ambient"], function (bot, message) {
  askRoles = function (response, convo) {
    convo.ask('What roles are you planning for? Please specify comma seperated!', function (response, convo) {
      parseRoles(response, convo);
      convo.next();
    });
  }
  parseRoles = function (response, convo) {
    var roles = response
      .text // extract actual message
      .split(',')//split by comma
      .map( // triem each role
      Function.prototype.call,
      String.prototype.trim
      );
    convo.say("here are your roles assigned to members" + JSON.stringify(roles));
  }

  bot.startConversation(message, askRoles);
});

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