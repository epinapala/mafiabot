var Botkit = require('botkit');
var _ = require('underscore');
var COMMAND_DELIMITER = '!';
var users = [];
var util = require('./util');

var controller = Botkit.slackbot({
  json_file_store: './storage'
});

var bot = controller.spawn({
  token: "xoxb-8526921072-OVtelBhvHrrmEvDPPC9EIDHQ"
});

bot.startRTM(function (err, bot, payload) {
  if (err) {
    throw new Error('Darn! Could not connect to slack!' + JSON.stringify(err));
  }
});

controller.hears([COMMAND_DELIMITER + "init"], ["direct_message", "direct_mention", "mention", "ambient"], function (bot, message) {
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
              controller.storage.users.save(user, function (err) {
                if (err) {
                  console.log("Unable to save user : " + user.name);
                } else {
                  console.log("Saved user : " + user.name);
                }
              });
            }
          });
        });
      } else {
        bot.reply(message, 'No channels returned from slack :(');
      }
    }
  });
});

controller.hears([COMMAND_DELIMITER + "start"], ["direct_message", "direct_mention", "mention", "ambient"], function (bot, message) {
  askRoles = function (response, convo) {
    convo.ask('What roles are you planning to assign? Please specify comma seperated!', function (response, convo) {
      parseRoles(response, convo);
      convo.next();
    });
  };
  parseRoles = function (response, convo) {
    var roles = response
      .text // extract actual message
      .split(',')//split by comma
      .map( // triem each role
      Function.prototype.call,
      String.prototype.trim
      );
    matchRoles(roles, convo);
    convo.next();
  };

  matchRoles = function (roles, convo) {
    controller.storage.users.all(function (err, all_user_data) {
      if (err) {
        convo.say('Oh no! Not able to read users list!')
      } else {
        var users = _.map(all_user_data, function (currentObject) {
          return _.pick(currentObject, "name");
        });
        var shuffledUsers = util.fisherYatesShuffle(users);
        var shuffledRoles = util.fisherYatesShuffle(roles);
        _.each(users, function (user, index) {
          user.role = shuffledRoles[index];
        });
        convo.say("here are your roles assigned to members" + JSON.stringify(users));
      }
    });
  };

  bot.startConversation(message, askRoles);
});