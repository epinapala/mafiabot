var Botkit = require('botkit');
var _ = require('underscore');
var COMMAND_DELIMITER = '!';
var users = [];
var util = require('./util');

var token = require('minimist')(process.argv.slice(2)).t;
var organizer = require('minimist')(process.argv.slice(2)).o;

var controller = Botkit.slackbot({
  json_file_store: './storage'
});

var bot = controller.spawn({
  token: token
});

bot.startRTM(function (err, bot, payload) {
  if (err) {
    throw new Error('Darn! Could not connect to slack!' + JSON.stringify(err));
  }
});

controller.hears([COMMAND_DELIMITER + "init_channel"], ["direct_message", "direct_mention", "mention", "ambient"], function (bot, message) {
  bot.api.channels.list({ channel: message.channel }, function (err, response) {
    var current_channel_id = message.channel;
    if (err) {
      bot.reply(message, "Unable to extract channel info : " + current_channel_id);
    } else {
      var channels = response.channels;
      if (channels) {
        var channel = _.find(channels, function (object) {
          return object.id === current_channel_id;
        });
        if (channel) {
          bot.reply(message, "Channel name is : " + channel.name);
          var users = channel.members || [];
          _.each(users, function (id) {
            bot.api.users.info({ user: id }, function (err, user_data) {
              var user = user_data.user;
              if (user.is_bot) {
                console.log("Bot User, Skipping!");
              } else {
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
              }
            });
          });
        } else {
          bot.reply(message, 'unable get channel info from slack!');
        }
      } else {
        bot.reply(message, 'No channels returned from slack :(');
      }
    }
  });
});

controller.hears([COMMAND_DELIMITER + "init"], ["direct_message", "direct_mention", "mention", "ambient"], function (bot, message) {
  bot.api.groups.list({ group: 'G1WNZGC76' }, function (err, response) {
    var current_group_id = 'G1WNZGC76';
    if (err) {
      bot.reply(message, "Unable to extract Group info : " + current_group_id);
    } else {
      var groups = response.groups;
      if (groups) {
        var group = _.find(groups, function (object) {
          return object.id === current_group_id;
        });
        if (group) {
          bot.reply(message, "Group name is : " + group.name);
          var users = group.members || [];
          _.each(users, function (id) {
            bot.api.users.info({ user: id }, function (err, user_data) {
              var user = user_data.user;
              if (user.is_bot) {
                console.log("Bot User, Skipping!");
              } else if(user.id === organizer){
              	console.log("Organier " + user.name + ", Skipping!");
              }else {
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
              }

            });
          });
        } else {
          bot.reply(message, 'unable get group info from slack!');
        }
      } else {
        bot.reply(message, 'No channels group from slack :(');
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
      .map( // trim each role
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
		  console.log(all_user_data.length);
        if (roles.length !== (all_user_data.length)) {
          convo.say("Number of roles doesnt match the number of users in this channel. Retry with !start command");
        } else {
          var users = _.map(all_user_data, function (currentObject) {
            return _.pick(currentObject, "name", "id");
          });
          var shuffledUsers = util.fisherYatesShuffle(users);
          var shuffledRoles = util.fisherYatesShuffle(roles);
          _.each(shuffledUsers, function (user, index) {
            user.role = shuffledRoles[index];
            bot.api.chat.postMessage({ channel: user.id, text: "Hi there! Your role is : " + user.role, username: "mafia-bot" }, function (err, response) {
              if (err) {
                console.log("Unable to reveal role to user : " + user.name + ". Error : " + err);
              } {
                console.log("Revealed role to user : " + user.name + " : " + user.role + " via DM");
              }
            });
            bot.api.chat.postMessage({ channel: organizer, text:  user.name +" role is : " + user.role, username: "mafia-bot" }, function (err, response) {
              if (err) {
                console.log("Unable to reveal role to user : " + user.name + ". Error : " + err);
              } {
                console.log("Revealed role to user : " + user.name + " via DM");
              }
            });
			
            bot.api.chat.postMessage({ channel: organizer, text: '-=-=-=-=-=-=-=-=-=-=-', username: "mafia-bot" }, function (err, response) {
            });
          });
          convo.say("Roles have been assigned and sent to all users");
          console.log("here are your roles assigned to members" + JSON.stringify(users));
        }
      }
    });
  };

  bot.startConversation(message, askRoles);
});
