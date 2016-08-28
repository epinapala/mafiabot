/** jshint esnext: true */

var bot;
var controller;
var Botkit = require('botkit');
var _Promise = require('bluebird');

/* utils */
var minimist = require('minimist');
var _ = require('underscore');
var helpers = require('./utils/helper');
var globalUtil = require('./utils/global');

/* parse command line args for default params. */
var storage_directory = minimist(process.argv.slice(2)).s || './storage';//read json file storage directory.
var token = minimist(process.argv.slice(2)).t; //read slack token.

if (!token) {
  console.log('Slack token is required. Please use \'-t\' to set Slack token');
}

var organizer_id = minimist(process.argv.slice(2)).o; //Default organizer ID.
var current_group_id = minimist(process.argv.slice(2)).g; //Default group ID.
var is_debug = minimist(process.argv.slice(2)).d;// read debug mode flag.
if (is_debug) {
  globalUtil.setIsDebugMode(is_debug);
}

/* Services */
var slackCommunicationService = require('./services/slack-communication-service');

/* String constants */
var MESSAGE_SEPERATOR = '-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-';
var ROLE_REMOVED_KEY = 'removed';
var ROLE_PREFERENCE_SEPERATOR = ':';
//commands
var COMMAND_DELIMITER = '!';
var COMMAND_INIT = 'init';
var COMMAND_START = 'start';

/**
 * Initialize bot and controller.
 */
controller = Botkit.slackbot({
  json_file_store: storage_directory
});
bot = controller.spawn({
  token: token
});


slackCommunicationService
  .initializeBotRtm(bot)
  .then(function () {
    /** Implement all commands in this step. */
    //Implementation for "init" command.
    controller.hears([COMMAND_DELIMITER + COMMAND_INIT], ['direct_message'], function (bot,
      message) {
      //Pull all groups.
      slackCommunicationService
        .retreiveAllGroups(bot, current_group_id).then(function (groups) {
          if (groups) {
            //Filter and get group by group ID
            var group = _.find(groups, function (object) {
              return object.id === current_group_id;
            });

            if (group) {
              //If group is found. shout out group name.
              bot.reply(message, 'A new game started in the group "' + group.name + '"');

              // clear users collection in memory.
              globalUtil.setUsers([]);

              //Get all users from group and iterate.
              var users = group.members || [];

              //Set the user currently intiializing the game as organizer.
              if (message.user) {
                organizer_id = message.user;
              }
              var userInfoPromises = [];
              /* collect all promises for execution. */
              _.each(users, function (id, index) {
                userInfoPromises.push(slackCommunicationService.retreiveUserInfo(bot, id));
              });

              /* use _Promise.all as we would like to reject even if one userInfo calls fails.*/
              _Promise.all(userInfoPromises)
                .then(function resolved(results) {
                  var all_users = 'Players :  ';
                  results.forEach(function (user) {
                    user.preferred_name = helpers.getUserPreferredName(user);
                    if (user.is_bot) {
                      console.log('Bot User [' + user.name + '], Skipping!');
                    } else if (user.id === organizer_id) {
                      console.log('Organizer [' + user.preferred_name + '] , Skipping!');
                      bot.reply(message, 'Organizer : ' + user.preferred_name + ' (You)');
                    } else {
                      globalUtil.getUsers().push(user);
                      all_users += user.preferred_name + ' (@' + user.name + ')' + ' | ';
                    }
                  });
                  bot.reply(message, all_users);
                }, function rejected(err) {
                  bot.reply(message, 'An error occour while reading users : ' + err);
                });


            } else {
              bot.reply(message, 'unable get group info from slack!');
            }
          } else {
            bot.reply(message, 'No channels group from slack :(');
          }
        });
    });

    /* Implementation for start command */
    controller.hears([COMMAND_DELIMITER + COMMAND_START], ['direct_message'], function (bot, message) {
      askRoles = function (response, convo) {
        convo.ask('What roles are you planning to assign? Please specify comma seperate. For specifying a role preference use colon and mention. Ex: Role1, Role2 ' + ROLE_PREFERENCE_SEPERATOR + ' @username, Role3.',
          function (response, convo) {
            parseRoles(response, convo);
            convo.next();
          });
      };

      parseRoles = function (response, convo) {
        var should_exit = false;
        var role_pref = {};
        var roles = response.text // extract actual message
          .split(',') // split by comma
          .map( // trim each role
          Function.prototype.call, String.prototype.trim);
        for (var i = 0; i < roles.length; i++) {
          if (roles[i].indexOf(ROLE_PREFERENCE_SEPERATOR) > -1) {
            var rolePlayerArr = roles[i].split(':').map(Function.prototype.call, String.prototype.trim);
            var cur_role = rolePlayerArr[0];
            var requested_player_id = rolePlayerArr[1].replace('<@', '').replace('>', '');
            if (requested_player_id.indexOf('@') < 0) {
              roles[i] = ROLE_REMOVED_KEY;
              role_pref[requested_player_id] = cur_role;
            } else {
              convo.say('Unable to identify role preference/user for entry : ' + roles[i]);
              should_exit = true;
            }
          }
        }
        if (!should_exit) {
          matchRolesForPreferenceUsers({
            roles: _.without(roles, ROLE_REMOVED_KEY),
            role_pref: role_pref
          }, convo);
          convo.next();
        }
      };

      matchRolesForPreferenceUsers = function (roles_meta, convo) {
        var roles = roles_meta.roles;
        var roleCount = roles.length + Object.keys(roles_meta.role_pref).length;
        var promises = [];

        var all_user_data = globalUtil.getUsers() || [];
        if (all_user_data.length < 1) {
          convo.say('Oh no! Not able to read users list!');
        } else {
          all_user_data = _.without(all_user_data, _.findWhere(all_user_data, {
            id: organizer_id
          }));
          if (roleCount !== (all_user_data.length)) {
            convo.say('Number of roles[' + roleCount + '] doesnt match the number of users[' +
              all_user_data.length + '] in this channel. Retry with !start command');
          } else {

            var users = _.map(all_user_data, function (currentObject) {
              return _.pick(currentObject, 'name', 'id', 'preferred_name');
            });

            var roles_pref_obj = roles_meta.role_pref;
            var user_ids = Object.keys(roles_pref_obj);
            var users_to_process = [];

            for (var j = 0; j < users.length; j++) {
              var _user = users[j];
              if (roles_pref_obj[_user.id]) {
                _user.role = roles_pref_obj[_user.id];
                promises.push(slackCommunicationService.messageUser(bot, _user));
                promises.push(slackCommunicationService.messageOrganizer(_user, convo));
              } else {
                users_to_process.push(_user);
              }
            }
            matchRolesForNonPreferenceUsers(users_to_process, roles, promises, convo, roles_meta);
            convo.next();
          }
        }
      };

      matchRolesForNonPreferenceUsers = function (users, roles, promises, convo, roles_meta) {
        var shuffledUsers = helpers.shuffle(users);
        var shuffledRoles = helpers.shuffle(roles);

        //Loop through shuffled users to fill roles and send messages
        //TODO normalize this logic to build messages in loop and then send messages in just 2 promises.
        //Send game name to organizer
        promises.push(slackCommunicationService.messageGameNameToOrganizer(convo));
        _.each(shuffledUsers, function (user, index) {
          var user_id = user.id;
          if (!user.is_processed) {
            user.role = shuffledRoles[index];
            promises.push(slackCommunicationService.messageUser(bot, user));
            promises.push(slackCommunicationService.messageUserRoleToOrganizer(user, convo));
          }
        });

        /**
         * We do a reflect of each promise inside all, this ensures 
         * promises are resolved wven when there are one or more rejects.
         */
        var promiseResults = _Promise.all(
          promises.map(
            function (promise) {
              return promise.reflect();
            }
          ));

        //inspect each of the promises that were deferred.
        promiseResults.each(function (inspection) {
          if (inspection.isFulfilled()) {
            console.log("Fulfilled Promise - ", inspection.value());
          } else {
            console.error("Rejected Promise - ", inspection.reason());
          }
        }).then(function () {
          convo.say(MESSAGE_SEPERATOR);
        });
        console.log('Here is a summary of all users and their roles : ' + JSON.stringify(users));
      };
      //initialize conversation with the organizer
      bot.startConversation(message, askRoles);
    });
  },
  /** Handle the final common rejection here. */
  function rejected(error) {
    console.log(error);
  });