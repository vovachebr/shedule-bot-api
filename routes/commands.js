const { SLACK_BOT_TOKEN } = process.env;

const router = require('express').Router();
const httpRequest = require('request');
const { connect } = require('./../util/mongoConnector');
const Logger = require('./../util/logger');

router.post("/addme", (request, response) => {
  const channelName = request.body.text.toLowerCase();
  const userId = request.body.user_id;
   
  connect(async (client) => {
    const body = request.body;
    const db = client.db("schedule");
    const hooksCollection = db.collection("hooks");

    const hook = await hooksCollection.findOne({channel: channelName});
    if(!hook){
      response.json({
        response_type: "ephemeral",
        text: "Канал не найден. Обратитесь к координатору курса за помощью."
      });
      Logger.sendMessage(`Неудачная попытка пользователя *${body.user_name}* добавиться в канал *${body.text}*. ☹️`);
      return;
    }

    options = {
      uri: `https://slack.com/api/conversations.invite?token=${SLACK_BOT_TOKEN}&channel=${hook.channelId}&users=${userId}`,
      method: 'POST'
    }

    httpRequest(options, (error, res) => {
      response.json({ blocks: [
        {
          "type": "section",
          text:{
            "type": "mrkdwn",
            text: `Вы добавлены в канал ${channelName}. 🎉`
          }
        }
      ]});
      Logger.sendMessage(`Удачная попытка пользователя *${body.user_name}* добавиться в канал *${body.text}*. 🎉`);
    });
  });
});

router.post("/moveme", (request, response) => {
  const channelName = request.body.text.toLowerCase();
  const userId = request.body.user_id;
   
  connect(async (client) => {
    const body = request.body;
    const db = client.db("schedule");
    const hooksCollection = db.collection("hooks");

    const hook = await hooksCollection.findOne({channel: channelName});
    if(!hook){
      client.close();
      response.json({
        response_type: "ephemeral",
        text: "Канал не найден. Обратитесь к координатору курса за помощью."
      });
      Logger.sendMessage(`Неудачная попытка пользователя *${body.user_name}* перенестись в канал *${body.text}*. ☹️`);
      return;
    }

    options = {
      uri: `https://slack.com/api/conversations.invite?token=${SLACK_BOT_TOKEN}&channel=${hook.channelId}&users=${userId}`,
      method: 'POST'
    }

    httpRequest(options, (error, res) => {
      options.uri = options.uri.replace("invite", "kick");
      options.uri = options.uri.replace("users", "user");
      options.uri = options.uri.replace(hook.channelId, request.body.channel_id);
      httpRequest(options, () => {
        Logger.sendMessage(`Удачная попытка пользователя *${body.user_name}* перенестись в канал *${body.text}*. 🎉`);
      });
    });
  });
});

module.exports = router;