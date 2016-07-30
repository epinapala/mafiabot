var Botkit = require('botkit');
 
var controller = Botkit.slackbot();
 
var bot = controller.spawn({
  token: "xoxb-8526921072-OVtelBhvHrrmEvDPPC9EIDHQ"
})
 
bot.startRTM(function(err,bot,payload) {
  if (err) {
    throw new Error('Darn! Could not connect to slack!');
  }
});
 
controller.hears(["=showall"],["direct_message","direct_mention","mention","ambient"],function(bot,message) {
  bot.reply(message,'Hello, how are you today?');
});