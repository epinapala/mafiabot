/** jshint esnext: true */
var controller, bot;
var Botkit = require('botkit');
var _ = require('underscore');
var _Promise = require('bluebird');
var rmdir = require('rimraf');

var util = require('./util');

var minimist = require('minimist');
var storage_directory = minimist(process.argv.slice(2)).s || './storage';
var token = minimist(process.argv.slice(2)).t;
var organizer_id = minimist(process.argv.slice(2)).o;
var current_group_id = minimist(process.argv.slice(2)).g;

var COMMAND_DELIMITER = '!';
var MESSAGE_SEPERATOR = '-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-';


function getUserName(user) {
  if (user.profile && user.profile.first_name) {
    return user.profile.first_name.trim();
  } else if (user.name) {
    return user.name;
  } else {
    return user.id;
  }
}

new _Promise(function (resolve, reject) {
  //Clear storage directory
  rmdir(storage_directory + '/users', function (error) {
    if (error) {
      bot.reply(message, 'Unable to initialize Game, Error : ' + err);
      reject(error);
    } else {
      controller = Botkit.slackbot({
        json_file_store: storage_directory
      });
      bot = controller.spawn({
        token: token
      });
      bot.startRTM(function (err, bot, payload) {
        if (err) {
          throw new Error('Darn! Could not connect to slack!' + JSON.stringify(err));
        } else {
          resolve();
        }
      });
    }
  });
}).then(function () {
  /** Implement all commands in this step. */

  /* Implementation for init command */
  controller.hears([COMMAND_DELIMITER + 'init'], ['direct_message'], function (bot,
    message) {


    new _Promise(function (resolve, reject) {
      //Set the user currently intiializing the game as organizer.
      if (message.user) {
        organizer_id = message.user;
        resolve();
      }
    }).then(function () {
      /** Populate all users in local json storage */
      //Pull all groups.
      new _Promise(function (resolve, reject) {
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
      }).then(function (groups) {
        if (groups) {
          //Filter and get group by group ID
          var group = _.find(groups, function (object) {
            return object.id === current_group_id;
          });

          if (group) {
            //If group is found. shout out group name.
            bot.reply(message, 'Group name is : ' + group.name);

            //Get all users from group and iterate.
            var users = group.members || [];
            _.each(users, function (id) {
              bot.api.users.info({
                user: id
              }, function (err, user_data) {
                var user = user_data.user;
                user.preferred_name = getUserName(user);
                if (user.is_bot) {
                  console.log('Bot User ['+ user.name +'], Skipping!');
                } else if (user.id === organizer_id) {
                  console.log('Organizer ['+ user.preferred_name +'] , Skipping!');
                } else {
                  if (err) {
                    bot.reply(message, 'Unable to find user : ' + id);
                  } else {
                    bot.reply(message, user.preferred_name);
                    controller.storage.users.save(user, function (err) {
                      if (err) {
                        console.log('Unable to save user : ' + user.preferred_name);
                      } else {
                        console.log('Saved user : ' + user.preferred_name);
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
      });
    });
  });

  /* Implementation for start command */
  controller.hears([COMMAND_DELIMITER + 'start'], ['direct_message'], function (bot, message) {
    askRoles = function (response, convo) {
      convo.ask('What roles are you planning to assign? Please specify comma seperated!', function (response, convo) {
        parseRoles(response, convo);
        convo.next();
      });
    };

    parseRoles = function (response, convo) {
      var roles = response.text // extract actual message
        .split(',') // split by comma
        .map( // trim each role
        Function.prototype.call, String.prototype.trim);
      matchRoles(roles, convo);
      convo.next();
    };

    matchRoles = function (roles, convo) {
      controller.storage.users.all(function (err, all_user_data) {
        if (err) {
          convo.say('Oh no! Not able to read users list!');
        } else {
          if (roles.length !== (all_user_data.length)) {
            convo.say('Number of roles[' + roles.length + '] doesnt match the number of users[' +
              all_user_data.length + '] in this channel. Retry with !start command');
          } else {
            var users = _.map(all_user_data, function (currentObject) {
              return _.pick(currentObject, 'name', 'id', 'preferred_name');
            });
            var shuffledUsers = util.shuffle(users);
            var shuffledRoles = util.shuffle(roles);
            var promises = [];

            //Loop through shuffled users to fill roles and send messages
            _.each(shuffledUsers, function (user, index) {
              user.role = shuffledRoles[index];
              var promise_user = new _Promise(function (resolve, reject) {
                bot.api.chat.postMessage({
                  channel: user.id,
                  text: 'Hi there ' + user.preferred_name + '! Your role is : ' + user.role,
                  username: 'mafia-bot',
                  as_user: true
                }, function (err, response) {
                  if (err) {
                    reject('Unable to reveal role to user : ' + user.preferred_name + '. Error : ' + err);
                  } {
                    resolve('Revealed role to user : ' + user.preferred_name + ' : ' + user.role + ' via DM');
                  }
                });
              });
              var promise_organizer = new _Promise(function (resolve, reject) {
                var privateMessage = user.preferred_name + '\'s role is : ' + user.role;
                convo.say(privateMessage);
                resolve(privateMessage);
              });
              promises.push(promise_user);
              promises.push(promise_organizer);
            });

            var promiseResults = _Promise.all(
              promises.map(
                function (promise) {
                  return promise.reflect();
                }
              )
            );
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
          }
        }
      });
    };
    //initialize conversation with the organizer
    bot.startConversation(message, askRoles);
  });
},
  /** Handle the final common rejection here. */
  function rejected(error) {
    console.log(error);
  });