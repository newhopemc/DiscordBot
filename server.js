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
			bot.channels.get("564761155411771411").setName(`️️Online játékos: ${ms.current_players}`)
			//bot.user.setActivity(ms.current_players + "/" + ms.max_players, { type: 'PLAYING' });
			//console.log("Server is online running version " + ms.version + " with " + ms.current_players + " out of " + ms.max_players + " players.");
			//console.log("Message of the day: " + ms.motd);
			//console.log("Latency: " + ms.latency + "ms");
		} else {
			bot.channels.get("564761155411771411").setName("A szerver OFFLINE")
		}
	});

	bot.channels.get("564839417408126986").setName(`Discord felhasználók: ${bot.channels.get("564761155411771411").guild.memberCount}`)
}, 10000)

bot.on('message', message => {
	if (message.author.id === bot.user.id) return
	if (isSupportChannel(message)) {
		var user
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
})

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
})

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
})

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
})

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
	if(message.channel.id == 564563820341755925) return
	if(message.content.startsWith('!announce')){
		var msg = message.content.replace('!announce ', "")
		
		message.channel.send(msg).then(function(msg2){
			message.channel.send("A következő üzenet jó így?").then(function(message){
				message.react("\u2705")
				message.react("❌")
			}).then(function(msg3){
				message.delete();	
						
				bot.on('messageReactionAdd', (reaction, user) => {
					if(reaction == "❌"){
						msg2.delete();
						msg3.delete();
					} else {
						
					}
				})
			})
		})
	}
})

bot.on('message', message => {
	if (message.content.startsWith('!about') || message.content.startsWith('!rólunk')) {
		message.channel.send("**Rólunk**", {
			embed: {
				author: {
					name: bot.user.username,
					url: "https://newhope.hu",
					icon_url: ""
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
})

bot.on('message', message => {
	if(message.content.startsWith("!szoba")){
		var rendelkezik = false
		message.delete()
		readFromFile("rooms.json").then(function(result){
			if(result["rooms"] == undefined){
				result["rooms"] = []
			}
			result["rooms"].forEach(function(elem){
				if(elem["user"] == message.author.id){
					rendelkezik = true;
				}
			})
			
			if(!rendelkezik){
				message.guild.createChannel(`${message.author.username} szobája`, "category")
				.then(category => {
					message.guild.createChannel(`társalgó`, "text")
					.then(channel => {
						channel.setParent(category.id)
						channel.send(`Üdvözöllek a **saját szobádban**!\n\nEbben a szobában teljesen szabadon módosíthatod a beállításokat, kedved szerint némíthatsz el mást vagy törölhetsz üzenetet.\n\nAmennyiben meg szeretnél valakit hívni, azt a \`!meghív\` paranccsal tudod.\nHasználat: \`!meghív JátékosNév\`\n\nHa valakit nem látsz többet szívesen a \`!kirúg\` paranccsal tudod kitenni a szűrét.\nHasználat: \`!kirúg JátékosNév\``)
						.then(function(){
							message.guild.createChannel(`beszélgető`, "voice")
							.then(voice => {
								voice.setParent(category.id)
								.then(function(){
									// Give the permission to view and send for the user, and also managing his/her own category
									category.overwritePermissions(
										message.author,
										{
											"VIEW_CHANNEL": true,
											"SEND_MESSAGES": true,
											"ADD_REACTIONS": true,
											"MANAGE_CHANNELS": true
										}
									)

									// Remove the permission from @everyone to view and send message
									category.overwritePermissions(
										channel.guild.defaultRole,
										{
											"VIEW_CHANNEL": false,
											"SEND_MESSAGES": false
										}
									)

									// Binds admins to the channel too
									category.overwritePermissions(
										channel.guild.roles.find("name", "HelpBot"),
										{
											"VIEW_CHANNEL": true,
											"SEND_MESSAGES": true,
											"ADD_REACTIONS": true,
											"MANAGE_CHANNELS": true

										}
									)

									var elem = {
										"user": message.author.id,
										"category": category.id
									}

									if(result["rooms"] == undefined){
										result["rooms"] = []
									}
									
									result["rooms"].push(elem)

									updateData("rooms.json", "rooms", result["rooms"])
									message.channel.send(`Sikeresen elkészült a szobád!`).then(function(msg){
										setTimeout(function(){
											msg.delete()
										}, 1000*30)
									})
								})
							})
						})
					})
				})
			} else {
				message.channel.send(`Már van neked egy saját szobád!`).then(function(msg){
					setTimeout(function(){
						msg.delete()
					}, 1000*30)
				})
			}
		})
	}
})

bot.on('message', message => {
	if(!isOwner(message.author, message.channel)) return;
	if(message.content.startsWith('!meghív')){
		try {
			var username = message.content.replace('!meghív ', '')
			if(username != ""){
				let user = bot.users.find(user => user.username == username)

				// Remove the permission from @everyone to view and send message
				message.channel.parent.overwritePermissions(
					user,
					{
						"VIEW_CHANNEL": true,
						"SEND_MESSAGES": true
					}
				).then(function(result, err){
					if(err) message.channel.send(`Sajnos nincs ${username} nevű felhasználó... Próbáld pontosabban!`)
					else message.channel.send(`Sikeresen meghívtad a szobádba!`)
				})
			}
		}
		catch(err){console.log(err)}
		message.delete()
	}
})

bot.on('message', message => {
	if(!isOwner(message.author, message.channel)) return;
	if(message.content.startsWith('!kirúg')){
		try {
			var username = message.content.replace('!kirúg ', '')
			if(username != ""){
				let user = bot.users.find(user => user.username == username)

				// Remove the permission from @everyone to view and send message
				message.channel.parent.overwritePermissions(
					user,
					{
						"VIEW_CHANNEL": false,
						"SEND_MESSAGES": false
					}
				).then(function(result, err){
					if(err) message.channel.send(`Sajnos nincs ${username} nevű felhasználó... Próbáld pontosabban!`)
					else message.channel.send(`Sikeresen meghívtad a szobádba!`)
				})
			}
		}
		catch(err){console.log(err)}
		message.delete()
	}
})

function isOwner(user, channel){
	return new Promise(function(resolve, reject){
		readFromFile("rooms.json").then(function(result, err){
			if(err) reject(err)
			var owner = false;
			result["rooms"].forEach(function(elem){
				if(channel.parent.id == elem["channelId"]){
					owner = true;
				}
			}, function(err){
				if(err) reject(err)
			})
			resolve(owner)
		})
	})
}

/*
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

				var dateOffset = (24*60*60*1000) * 5; //5 days
				var myDate = new Date(new Date(result["reminders"][i]["date"]).getTime() - dateOffset); 

				var d = new Date(result["reminders"][i]["date"]);

				console.log('Today is: ' + d.toLocaleString());
				
				d.setDate(d.getDate() - 5);
				
				console.log('<br>5 days ago was: ' + d.toLocaleString());

				if(new Date(result["reminders"][i]["date"]) < new Date() && new Date() > d){
					result["reminders"][i]["reminded"] = true
					updateData("reminders.json", "reminders", result["reminders"]).then(function(){
						console.log(`Reminded: ${result["reminders"][i]["name"]}`)
						bot.channels.get(result['reminders'][i]["channel"]).send(`**Esemény**\n\`${result['reminders'][i]['name']}\``)
					})
				} else {
					console.log("Not in interval")
					
					console.log(`${new Date(result["reminders"][i]["date"]).toString()} => ${new Date().toString()}, ${myDate}`)
				}
			}
		}
	})
}, 1000)
*/

console.log(`NewHope Discord bot\nVersion: ${require('./package.json').version}`)
bot.login(process.env.TOKEN)