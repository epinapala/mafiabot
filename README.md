# MafiaBot

----
## what is MafiaBot?

A simple slackbot to help the mafia game organizer. The bot uses botkit, which inturn uses slack RTM api to communicate with slack.


---
## What is working?
* Bot development is in a very early stage.
* Only shuffling of users(in the group specified) and roles is supported.
* For now only private channels(groups) are supported.

----
## How can I use it?

### Using with Docker

`$ docker run -e token={slack_bot_token}  -e organizer={organizer_id} -e group="{slack_group_id}" -d -d docker.pkg.github.com/epinapala/mafiabot/mafiabot:latest`

* note: If you want to run th contianer at startup use `--restart unless-stopped` after `run`


### Using with NodeJS

#### Start bot
`$ node app.js -t {slack_bot_token}  -o {organizer_id} -g {slack_group_id}`

* note : use '-d' to start bot in debug mode, this ensures messages are sent only to the organizer for testing.

####Example response
`info: ** Using simple storage. Saving data to ./storage`

`info: ** Setting up custom handlers for processing Slack messages`

`info: ** API CALL: https://slack.com/api/rtm.start`

`notice: ** BOT ID: mafia-bot ...attempting to connect to RTM!`

`notice: RTM websocket opened`

Goto your slack bot and you can start communicating.

** Who ever chats with mafia-bot will be set as the organizer. Rest fo the users(excluding bots) in the mafia group will be used as players.

`!init` -- intializes bot, storage & other stuff.

`!start` -- starts a conversation with the bot.

![Imgur](http://i.imgur.com/0N1Gnvr.jpg)

![Imgur](http://i.imgur.com/Q6PmU9l.jpg)

----
## thanks
* [botkit](https://github.com/howdyai/botkit)

---
##And finally, the license stuff
This app source is released under GPLv3: http://www.gnu.org/licenses/gpl.html
