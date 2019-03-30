const Discord = require('discord.js');
const async = require('async');
const bot = new Discord.Client();
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
// For use with Node.js
var ms = require('./minestat');
const http = require('http');
const express = require('express');
const app = express();

app.get("/", (request, response) => {
  console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
});

app.listen(8080);
setInterval(() => {
http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 6000);

setInterval(() => {
  ms.init('play.newhope.hu', 25565, function(result)
{
  console.log("Minecraft server status of " + ms.address + " on port " + ms.port + ":");
  if(ms.online)
  {
    bot.user.setActivity(ms.current_players +"/"+ ms.max_players, { type: 'PLAYING' });
    console.log("Server is online running version " + ms.version + " with " + ms.current_players + " out of " + ms.max_players + " players.");
    console.log("Message of the day: " + ms.motd);
    console.log("Latency: " + ms.latency + "ms");
  }
  else
  {
    bot.user.setActivity("Offline", {type: 'WATCHING'});
  }
});
}, 10000);

bot.on('message', message => {
  if(message.channel.id != 561492853352693761) return false;
  if(message.content.startsWith('!help')) {
  //message.channel.send('Megkaptam!')
    var server = message.guild;
    
    
    
    server.createChannel("general", "text")
    .then(channel => {
      let category = server.channels.find(c => c.name == "Support" && c.type == "category");
      category.children.count({}, function(error, numOfDocs) {
    console.log('I have '+numOfDocs+' documents in my collection');
    // ..
})
      if (!category) throw new Error("Category channel does not exist");
      channel.setParent(category.id);
      channel.overwritePermissions(
        message.author,
        {
          "VIEW_CHANNEL": true,
          "SEND_MESSAGES": true 
        },
        // optional 'reason' for permission overwrite
        'to make channel'
      )
      channel.overwritePermissions(
        channel.guild.defaultRole,
        {
          "VIEW_CHANNEL": false,
          "SEND_MESSAGES": false
        },
        'to not make it visible for all'
      )
    }).catch(console.error);
    
    message.delete()
  }
});


bot.login(process.env.TOKEN);
