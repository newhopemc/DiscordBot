// Dependencies
const Discord = require('discord.js');
const http = require('http');
const express = require('express');
const app = express();
var ms = require('./minestat');
const fs = require('fs');

// Bot constant to be referenced
const bot = new Discord.Client();

// Keep Glitch bot alive, i know it sucks :/
app.get("/", (request, response) => {
	response.sendStatus(200);
});
app.listen(8080);

setInterval(() => {
	http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 6000);

// Get server status every 10 seconds
setInterval(() => {
	// play.newhope.hu(:25565)
	ms.init('play.newhope.hu', 25565, function (result) {
		//console.log("Minecraft server status of " + ms.address + " on port " + ms.port + ":");
		if (ms.online) {
			bot.user.setActivity(ms.current_players + "/" + ms.max_players, { type: 'PLAYING' });
			//console.log("Server is online running version " + ms.version + " with " + ms.current_players + " out of " + ms.max_players + " players.");
			//console.log("Message of the day: " + ms.motd);
			//console.log("Latency: " + ms.latency + "ms");
		} else {
			bot.user.setActivity("Offline", { type: 'WATCHING' });
		}
	});
}, 10000);

bot.on('message', message => {
	if (message.author.id === bot.user.id) return
	if (isSupportChannel(message)) {
		var user;
		getTicketAuthor(message).then(function (result, err) {
			if (err) reject(err)
			user = result

			if (message.content.startsWith('!bezár')) {
				message.channel.send("A hibajegy bezárásához kattints a `✔️` reakcióra, ha úgy érzed sikeresen megoldottuk a problmádat, ha pedig azt érzed nem sikerült kattints a `❌` gombra!").then(function (message) {
					message.react("\u2705")
					message.react("❌")
				})
				message.delete()
			} else if (message.author.id != user && message.author.id != bot.user.id) {
				//console.log(user)
				message.channel.setName(`❗-${message.channel.name.substr(1, message.channel.name.length)}`)
			} else if (message.author.id == user) {
				message.channel.setName(`❓-${message.channel.name.substr(1, message.channel.name.length)}`)
			}
		})
	}
});

function getTicketAuthor(message) {
	return new Promise(function (resolve, reject) {
		readFromFile("datas.json").then(function (result, err) {
			if (err) reject(err)
			result["support-channels"].forEach(function (elem) {
				if (elem["channelId"] == message.channel.id) {
					resolve(elem["user"])
				}
			})
		})
	})
}

bot.on('messageReactionAdd', (reaction, user) => {
	if (!isSupportChannel(reaction.message)) return
	if (user.id === bot.user.id) return
	//console.log(`${user.username} reacted with "${reaction.emoji.name}".`)
	//console.log(`${reaction.emoji}${reaction.message.channel.name.substr(1, reaction.message.channel.name.length)}`)
	reaction.message.channel.setName(`${reaction.emoji}-${reaction.message.channel.name.substr(1, reaction.message.channel.name.length)}`)
	reaction.message.delete()

	reaction.message.channel.send("Örülünk, hogy segíthettünk neked!")
	reaction.message.channel.send("Amennyiben bármilyen ezzel a problémával kapcsolatos gondod akadt nyugodtan írj ebbe a szobába!")
	reaction.message.channel.send("Ha a hiba nem köthető ehhez, akkor kérlek ebben az esetben nyiss egy új szobát!")
	reaction.message.channel.send("További jó játékot kíván a **NewHope csapata**!")
});

bot.on('messageReactionAdd', (reaction, user) => {
	if (!isSupportChannel(reaction.message)) return
	if (user.id === bot.user.id) return
	//console.log(`${user.username} reacted with "${reaction.emoji.name}".`)
	//console.log(`${reaction.emoji}${reaction.message.channel.name.substr(1, reaction.message.channel.name.length)}`)
	reaction.message.channel.setName(`${reaction.emoji}-${reaction.message.channel.name.substr(1, reaction.message.channel.name.length)}`)
	reaction.message.delete()

	reaction.message.channel.send("Örülünk, hogy segíthettünk neked!")
	reaction.message.channel.send("Amennyiben bármilyen ezzel a problémával kapcsolatos gondod akadt nyugodtan írj ebbe a szobába!")
	reaction.message.channel.send("Ha a hiba nem köthető ehhez, akkor kérlek ebben az esetben nyiss egy új szobát!")
	reaction.message.channel.send("További jó játékot kíván a **NewHope csapata**!")
});

bot.on('message', message => {
	// #support channel
	if (message.channel.id != 561660773848449215) return false;
	if (message.content.startsWith('!help') || message.content.startsWith('!segítség') || message.content.startsWith('!support')) {
		var server = message.guild;
		var channelId;
		readFromFile("datas.json").then(function (result) {
			if (result["support-channels"] != undefined) {
				channelId = result["support-channels"].length + 1
			} else {
				channelId = 1;
			}
			// Channel namings:
			// ❓-support-## <= Newly created, not a single admin responded
			// (⁉) ❗-support-## <= Responded admin, waiting for user
			// ❌-support-## <= Can not be fixed
			// ✔️-support-## <= Problem solved

			var channelName = `❓-support-${channelId}`
			server.createChannel(channelName, "text")
				.then(channel => {
					// Give the permission to view and send for the user
					channel.overwritePermissions(
						message.author,
						{
							"VIEW_CHANNEL": true,
							"SEND_MESSAGES": true,
							"ADD_REACTIONS": false,
							"MANAGE_CHANNELS": false
						}
					)

					// Remove the permission from @everyone to view and send message
					channel.overwritePermissions(
						channel.guild.defaultRole,
						{
							"VIEW_CHANNEL": false,
							"SEND_MESSAGES": false
						}
					)

					// Binds admins to the channel too
					channel.overwritePermissions(
						channel.guild.roles.find("name", "Adminisztrátor"),
						{
							"VIEW_CHANNEL": true,
							"SEND_MESSAGES": true,
							"MANAGE_CHANNELS": true
						}
					)

					// Binds admins to the channel too
					channel.overwritePermissions(
						channel.guild.roles.find("name", "HelpBot"),
						{
							"VIEW_CHANNEL": true,
							"SEND_MESSAGES": true,
							"ADD_REACTIONS": true,
							"MANAGE_CHANNELS": true

						}
					)

					// Support category
					let category = server.channels.find(c => c.name == "Support" && c.type == "category");
					if (!category) throw new Error("Category channel does not exist");
					channel.setParent(category.id);

					channel.send("Üdvözöllek a **NewHope támogatás rendszerében**!")
					channel.send("Kérlek írd le, hogy mi a problémád és az egyik adminisztrátor hamarosan válaszol!")
					channel.send("Ha úgy érzed, hogy a problémád megoldódott írd be, hogy `!bezár` és a kövesd a bot utasításait!")

					readFromFile("datas.json").then(function (result) {
						var elem = {
							"channelId": channel.id,
							"user": message.author.id
						}
						if (result["support-channels"] == undefined) {
							result["support-channels"] = []
						}

						result["support-channels"].push(elem);

						updateData("datas.json", "support-channels", result["support-channels"]).then(function (result, err) {
							if (err) console.log(err)
							console.log(result)
						})
					})

					message.author.send("A szobád sikeresen elkészült a `❓-support-" + channelId + "` néven!")
				}).catch(console.error);

			// Remove !help message
			message.delete()
		})
	}
});

function isSupportChannel(message) {
	return new Promise(function (resolve, err) {
		var toReturn = false
		readFromFile("datas.json").then(function (result, err) {
			if (err) reject(err)
			result["support-channels"].forEach(function (elem) {
				if (elem["channelId"] == message.channel.id) {
					toReturn = true
				}
			})
		})
		resolve(toReturn)
	})
}

function saveToFile(fileName, data) {
	return new Promise(function (resolve, reject) {
		fs.writeFile(fileName, JSON.stringify(data), function (result, err) {
			if (err) reject(err)
			resolve(result)
		})
	})
}

function readFromFile(file) {
	return new Promise(function (resolve, reject) {
		if (fs.existsSync(file)) {
			fs.readFile(file, 'utf8', function (err, data) {
				if (err) resolve({})
				resolve(JSON.parse(data))
			})
		} else {
			resolve({})
		}
	})
}

function updateData(fileName, data, value) {
	return new Promise(function (resolve, reject) {
		readFromFile(fileName).then(function (result) {
			result[data] = value
			saveToFile(fileName, result).then(function (result, err) {
				if (err) reject(err)
				resolve(result)
			})
		})
	})
}

bot.on('message', message => {
	if (message.content.startsWith('!about') || message.content.startsWith('!rólunk')) {
		message.channel.send("**Rólunk**", {
			embed: {
				author: {
					name: bot.user.username,
					url: "https://newhope.hu",
					icon_url: bot.user.displayAvatarURL
				},
				color: 5663164,
				fields: [{
					name: "Felhasználónév",
					value: bot.user.username,
					inline: true
				}, {
					name: "Verzió",
					value: "NewHope Bot v" + require('./package.json').version,
					inline: true
				}, {
					name: "Fejlesztő",
					value: "Gál Péter (pepyta)",
					inline: true
				}],
				thumbnail: {
					url: bot.user.displayAvatarURL
				}
			}
		})
	}
});

bot.on('message', message => {
	if (message.content.startsWith('!remind') || message.content.startsWith('!emlékeztess') || message.content.startsWith('!emlékeztető')) {
		var msg = message.content.replace("!remind ", "").replace("!emlékeztess ", "").replace("!emlékeztető ", "");
		if (msg != "") {
			message.channel.send(`Írd be, hogy mikorra szeretnél létrehozni a emlékeztetőt a következő dologról: \`${msg}\``);
			//message.channel.send(`${message.author.id} == ${bot.user.id}`)
			bot.on('message', message2 => {
				if (message2.channel != message.channel) return;

				if (message2.author.id !== bot.user.id) {

					readFromFile("reminders.json").then(function(result){
						var elem = {
							"name": msg,
							"date": new Date(message2.content),
							"channel": message.channel.id,
							"reminded": false
						}
						
						if (result["reminders"] == undefined) {
							result["reminders"] = []
						}
						result["reminders"].push(elem)
						updateData("reminders.json", "reminders", result["reminders"]).then(function(){		
							message.channel.send("**Új emlékeztető**", {
								embed: {
									author: {
										name: "",
										url: "",
										icon_url: ""
									},
									color: 5663164,
									fields: [{
										name: "Esemény neve",
										value: msg,
										inline: true
									},{
										name: "Időpont",
										value: new Date(message2.content).toString(),
										inline: true
									}],
									thumbnail: {
										url: ""
									}
								}
							})
						})
					})
				}

				return;
			})

		}
	}
	if (message.content.startsWith('!most')) {
		message.channel.send(new Date().toString());
	}
	if (message.content.startsWith('!toDate')) {
		message.channel.send(new Date(message.content.replace("!toDate ", "")).toDateString())
	}
	if(message.content.startsWith('reminders')){
		readFromFile('reminders.json').then(function(result){
			message.channel.send(JSON.stringify(result))
		})
	}
})

setInterval(() => {
	readFromFile("reminders.json").then(function(result){
		for(var i = 0; i < result["reminders"].length; i++){
			if(!result["reminders"][i]["reminded"]){
				console.log("Reminded!")
				if(new Date(result["reminders"][i]["date"]) < new Date() && new Date(result["reminders"][i]["date"]) > (new Date()-(5*60*1000))){
					result["reminders"][i]["reminded"] = true
					updateData("reminders.json", "reminders", result["reminders"]).then(function(){
						console.log(`Reminded: ${result["reminders"][i]["name"]}`)
						bot.channels.get(result['reminders'][i]["channel"]).send(`**Esemény**\n\`${result['reminders'][i]['name']}\``)
					})
				} else {
					console.log("Not in interval")
					
					console.log(`${new Date(result["reminders"][i]["date"]).toString()} => ${new Date().toString()}, ${(new Date()-(5*60*1000)).toString()}`)
				}
			}
		}
	})
}, 1000)

console.log(`NewHope Discord bot\nVersion: ${require('./package.json').version}`)
bot.login(process.env.TOKEN)