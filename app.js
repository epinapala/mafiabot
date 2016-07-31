var Botkit = require('botkit')
var _ = require('underscore')
var COMMAND_DELIMITER = '!'
var users = []
var util = require('./util')
var Promise = require('bluebird')
var rmdir = require('rimraf')
var minimist = require('minimist')
var controller, bot

var storage_directory = minimist(process.argv.slice(2)).s || './storage'
var token = minimist(process.argv.slice(2)).t
var organizer = minimist(process.argv.slice(2)).o
var current_group_id = minimist(process.argv.slice(2)).g

new Promise(function (resolve, reject) {
  rmdir(storage_directory, function (error) {
    if (error) {
      reject(error)
    } else {
      resolve()
    }
  })
}).then(function () {
  controller = Botkit.slackbot({
    json_file_store: storage_directory
  })

  bot = controller.spawn({
    token: token
  })

  bot.startRTM(function (err, bot, payload) {
    if (err) {
      throw new Error('Darn! Could not connect to slack!' + JSON.stringify(err))
    }
  })
}).then(function () {
  controller.hears([COMMAND_DELIMITER + 'init'], ['direct_message', 'direct_mention', 'mention', 'ambient'], function (bot, message) {
    bot.api.groups.list({ group: current_group_id }, function (err, response) {
      if (err) {
        bot.reply(message, 'Unable to extract Group info : ' + current_group_id)
      } else {
        var groups = response.groups
        if (groups) {
          var group = _.find(groups, function (object) {
            return object.id === current_group_id
          })
          if (group) {
            bot.reply(message, 'Group name is : ' + group.name)
            var users = group.members || []
            _.each(users, function (id) {
              bot.api.users.info({ user: id }, function (err, user_data) {
                var user = user_data.user
                if (user.is_bot) {
                  console.log('Bot User, Skipping!')
                } else if (user.id === organizer) {
                  console.log('Organier ' + user.name + ', Skipping!')
                } else {
                  if (err) {
                    bot.reply(message, 'Unable to find user : ' + id)
                  } else {
                    bot.reply(message, user.name)
                    controller.storage.users.save(user, function (err) {
                      if (err) {
                        console.log('Unable to save user : ' + user.name)
                      } else {
                        console.log('Saved user : ' + user.name)
                      }
                    })
                  }
                }
              })
            })
          } else {
            bot.reply(message, 'unable get group info from slack!')
          }
        } else {
          bot.reply(message, 'No channels group from slack :(')
        }
      }
    })
  })

  controller.hears([COMMAND_DELIMITER + 'start'], ['direct_message', 'direct_mention', 'mention', 'ambient'], function (bot, message) {
    askRoles = function (response, convo) {
      convo.ask('What roles are you planning to assign? Please specify comma seperated!', function (response, convo) {
        parseRoles(response, convo)
        convo.next()
      })
    }
    parseRoles = function (response, convo) {
      var roles = response
        .text // extract actual message
        .split(',') // split by comma
        .map( // trim each role
          Function.prototype.call,
          String.prototype.trim
      )
      matchRoles(roles, convo)
      convo.next()
    }

    matchRoles = function (roles, convo) {
      controller.storage.users.all(function (err, all_user_data) {
        if (err) {
          convo.say('Oh no! Not able to read users list!')
        } else {
          if (roles.length !== (all_user_data.length)) {
            convo.say('Number of roles[' + roles.length + '] doesnt match the number of users[' + all_user_data.length + '] in this channel. Retry with !start command')
          } else {
            var users = _.map(all_user_data, function (currentObject) {
              return _.pick(currentObject, 'name', 'id')
            })
            var shuffledUsers = util.fisherYatesShuffle(users)
            var shuffledRoles = util.fisherYatesShuffle(roles)
            _.each(shuffledUsers, function (user, index) {
              user.role = shuffledRoles[index]

              new Promise(function (resolve, reject) {
                bot.api.chat.postMessage({ channel: user.id, text: 'Hi there! Your role is : ' + user.role, username: 'mafia-bot' }, function (err, response) {
                  if (err) {
                    reject('Unable to reveal role to user : ' + user.name + '. Error : ' + err)
                  } {
                  console.log('Revealed role to user : ' + user.name + ' : ' + user.role + ' via DM')
                  resolve(user)
                  }
                })
              }).then(function resolved (user) {
                bot.api.chat.postMessage({ channel: organizer, text: user.name + ' role is : ' + user.role, username: 'mafia-bot' }, function (err, response) {})
              }).then(function () {
                bot.api.chat.postMessage({ channel: organizer, text: '-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-', username: 'mafia-bot' }, function (err, response) {})
              }).then(function () {
                convo.say('Roles have been assigned and sent to all users')
                console.log('here are your roles assigned to members' + JSON.stringify(users))
              }, function (err) {
                console.log(err)
              })
            })
          }
        }
      })
    }

    bot.startConversation(message, askRoles)
  })
}, function rejected (error) {
  console.log(error)
})
