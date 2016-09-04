/*jshint esnext : true*/

let bot;
let controller;
const Botkit = require('botkit');
const _Promise = require('bluebird');

/* utils */
const minimist = require('minimist');
const _ = require('underscore');
const helpers = require('./utils/helper');
const globalUtil = require('./utils/global');

/* parse command line args for default params. */
const storage_directory = minimist(process.argv.slice(2)).s || './storage';//read json file storage directory.
const token = minimist(process.argv.slice(2)).t; //read slack token.

if (!token) {
  console.log('Slack token is required. Please use \'-t\' to set Slack token');
}

let organizer_id = minimist(process.argv.slice(2)).o; //Default organizer ID.
let current_group_id = minimist(process.argv.slice(2)).g; //Default group ID.
const is_debug = minimist(process.argv.slice(2)).d;// read debug mode flag.
if (is_debug) {
  globalUtil.setIsDebugMode(is_debug);
}

/* Services */
const slackCommunicationService = require('./services/slack-communication-service');

/* String constants */
const constants = require('./lib/constants');
const ROLE_MANDATORY = constants.ROLE_MANDATORY;
const ROLE_OPTIONAL = constants.ROLE_OPTIONAL;
const MESSAGE_SEPERATOR = constants.MESSAGE_SEPERATOR;
const ROLE_REMOVED_KEY = constants.ROLE_REMOVED_KEY;
const ROLE_PREFERENCE_SEPERATOR = constants.ROLE_PREFERENCE_SEPERATOR;

//commands
const COMMAND_DELIMITER = constants.COMMAND_DELIMITER;
const COMMAND_INIT = constants.COMMAND_INIT;
const COMMAND_START = constants.COMMAND_START;

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
            let group = _.find(groups, function (object) {
              return object.id === current_group_id;
            });

            if (group) {
              //If group is found. shout out group name.
              bot.reply(message, 'A new game started in the group "' + group.name + '"');

              // clear users collection in memory.
              globalUtil.setUsers([]);

              //Get all users from group and iterate.
              let users = group.members || [];

              //Set the user currently intiializing the game as organizer.
              if (message.user) {
                organizer_id = message.user;
              }
              let userInfoPromises = [];
              /* collect all promises for execution. */
              _.each(users, function (id, index) {
                userInfoPromises.push(slackCommunicationService.retreiveUserInfo(bot, id));
              });

              /* use _Promise.all as we would like to reject even if one userInfo calls fails.*/
              _Promise.all(userInfoPromises)
                .then(function resolved(results) {
                  let all_users = 'Players :  ';
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

      initConvo = function (response, convo) {
        convo.ask('Do you want to customize roles?  Say YES, NO or DONE to quit.', [
          {
            pattern: 'done',
            callback: function (response, convo) {
              convo.say('OK, take your time!');
              convo.next();
            }
          },
          {
            pattern: bot.utterances.yes,
            callback: function (response, convo) {
              convo.ask(
                'Great, Please use the following format to specify roles' + '\n' +
                'mandatory_role1:max,mandatory_role2:max...etc|opt_role_1:max,opt_role_2:max..etc' + '\n' +
                'type \'done\' to quit any time',
                [
                  {
                    pattern: 'done',
                    callback: function (response, convo) {
                      convo.say('OK, take your time!');
                      convo.next();
                    }
                  },
                  {
                    default: true,
                    callback: function (response, convo) {
                      parseCustomizedRoles(response, convo);
                      convo.next();
                    }
                  }
                ]);

              convo.next();
            }
          },
          {
            pattern: bot.utterances.no,
            callback: function (response, convo) {
              globalUtil.generateRandomWord();
              convo.ask(
                'What roles are you planning to assign? Please specify comma seperated' + '\n' +
                'For specifying a role preference use colon and mention. Ex: Role1, Role2 ' + ROLE_PREFERENCE_SEPERATOR + ' @username, Role3.' + '\n' +
                'Type \'done\' anytime to quit.',
                [{
                  pattern: 'done',
                  callback: function (response, convo) {
                    convo.say('OK, take your time!');
                    convo.next();
                  }
                },
                  {
                    default: true,
                    callback: function (response, convo) {
                      parseCommaSeperatedRoles(response, convo);
                      convo.next();
                    }
                  }]);
              convo.next();
            }
          },
          {
            default: true,
            callback: function (response, convo) {
              // just repeat the question
              convo.repeat();
              convo.next();
            }
          }
        ]);
      };
      parseCustomizedRoles = function (response, convo) {
        const roles = helpers.getCommaSeperatedRolesFromCustomFormat(response.text);
        let user_count = (globalUtil.getUsers() || []).length;
        let roleList = helpers.getComputedRoleResult(roles, user_count);
        //convo.say(JSON.stringify(roleList));
      };

      parseCommaSeperatedRoles = function (response, convo) {
        let should_exit = false;
        let role_pref = {};
        let roles = response.text // extract actual message
          .split(',') // split by comma
          .map( // trim each role
          Function.prototype.call, String.prototype.trim);
        for (let i = 0; i < roles.length; i++) {
          if (roles[i].indexOf(ROLE_PREFERENCE_SEPERATOR) > -1) {
            let rolePlayerArr = roles[i].split(':').map(Function.prototype.call, String.prototype.trim);
            let cur_role = rolePlayerArr[0];
            let requested_player_id = rolePlayerArr[1].replace('<@', '').replace('>', '');
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
        } else {
          convo.repeat();
        }
      };

      matchRolesForPreferenceUsers = function (roles_meta, convo) {
        let roles = roles_meta.roles;
        let roleCount = roles.length + Object.keys(roles_meta.role_pref).length;
        let promises = [];

        let all_user_data = globalUtil.getUsers() || [];
        if (all_user_data.length < 1) {
          convo.say('Oh no! Not able to read users list!');
          convo.repeat();
        } else {
          all_user_data = _.without(all_user_data, _.findWhere(all_user_data, {
            id: organizer_id
          }));
          if (roleCount !== (all_user_data.length)) {
            convo.say('Number of roles[' + roleCount + '] doesnt match the number of users[' +
              all_user_data.length + '] in this channel. Retry with !start command');
            convo.repeat();
          } else {

            let users = _.map(all_user_data, function (currentObject) {
              return _.pick(currentObject, 'name', 'id', 'preferred_name');
            });

            let roles_pref_obj = roles_meta.role_pref;
            let user_ids = Object.keys(roles_pref_obj);
            let users_to_process = [];

            for (let j = 0; j < users.length; j++) {
              let _user = users[j];
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
        let shuffledUsers = helpers.shuffle(users);
        let shuffledRoles = helpers.shuffle(roles);

        //Loop through shuffled users to fill roles and send messages
        //TODO normalize this logic to build messages in loop and then send messages in just 2 promises.
        //Send game name to organizer
        promises.push(slackCommunicationService.messageGameNameToOrganizer(convo));
        _.each(shuffledUsers, function (user, index) {
          let user_id = user.id;
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
        let promiseResults = _Promise.all(
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
      bot.startConversation(message, initConvo);
    });
  },
  /** Handle the final common rejection here. */
  function rejected(error) {
    console.log(error);
  });