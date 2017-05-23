var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

server.listen(8080);

var allchathistory = [];

var preAuth = require('http-auth');
var basic = preAuth.basic({
	realm: "Restricted Access! Please login to proceed"
  }, function (username, password, callback) { 
    callback( (username === "pactera" && password === "fwddemo"));
  }
);

var role;
var room;
var sentiment;
var needHelp = false;
var bot;
var livechatID

var hat = require('hat');

// routing
app.use(preAuth.connect(basic)).get('/agent', function (req, res) {
  res.sendfile(__dirname + '/index.html');
  role = 'agent';
});
app.use(preAuth.connect(basic)).get('/client', function (req, res) {
  res.sendfile(__dirname + '/index-client.html');
  role = 'client';
}).use(express.static('./'));

// usernames which are currently connected to the chat
var usernames = {};

// rooms which are currently available in chat
var rooms = [];
var roomsBehavior = [];
var tokens = [];
var names = [];
var roles = [];

io.sockets.on('connection', function (socket) {
	
	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		var token = hat();
		var roomdetail = [];
		socket.token = token;
		// socket.role = role;

		// add chat history.
		socket.chathistory = [];
		room = token;
		rooms.push(room);
		tokens.push(token);
		roles.push(role);
		// store the username in the socket session for this client
		socket.username = username;

		// set role
		socket.role = role;

		// store the room name in the socket session for this client
		socket.room = room;
		console.log('------------' + room);
		socket.emit('getroom', room);
		allchathistory[room] = [];

		// add the client's username to the global list
		usernames[username] = username;
		names.push(username);

		// send client to room 1
		socket.join(room);
		
		// roomsBehavior = [];
		for (var i = 0, length = rooms.length; i < length; i++) {
		    if (roomsBehavior.length === 0) {
			    var roomInfo = {};

				roomInfo['room'] = rooms[i];
				roomInfo['bot'] = true; 
				roomInfo['livechatID'] = ''; 

			  	roomsBehavior.push(roomInfo);
		    } 
		    console.log('---------------------');
		    console.log(roomsBehavior.length);
		    console.log(roomsBehavior[0]['room']);
		    console.log(rooms[roomsBehavior.length]);
		    console.log(rooms.length);
		    console.log('---------------------');

			for (var i = roomsBehavior.length, length = rooms.length; i < length; i++) {

			    var roomInfo = {};

				roomInfo['room'] = rooms[i];
				roomInfo['bot'] = true; 
				roomInfo['livechatID'] = ''; 

			  	roomsBehavior.push(roomInfo);

			}
		 //  	for (var key in roomsBehavior){
		 //  		console.log(roomsBehavior[key]['room']);
		 //  		console.log(rooms[i])
			//     if (roomsBehavior[key]['room'] !== rooms[i]) {

			// 	    var roomInfo = {};

			// 		roomInfo['room'] = rooms[i];
			// 		roomInfo['bot'] = true; 

			// 	  	roomsBehavior.push(roomInfo);
			//     } else {
			//     	break;
			//     }
			// }
			
		}
		console.log(roomsBehavior);
		console.log(rooms);

		// echo to client they've connected
		// socket.emit('updatechat', 'SERVER', 'you have connected to room1');
		// echo to room 1 that a person has connected to their room
		// socket.broadcast.to('room1').emit('updatechat', 'SERVER', username + ' has connected to this room');
		socket.emit('updaterooms', rooms, room, names, roles, allchathistory);
	});
	
	
	socket.on('setBot', function (setBotRoom, setBotIndex) {
		// roomsBehavior
		for (var i = 0, length = roomsBehavior.length; i < length; i++) {
				
		  	// console.log(roomsBehavior[i]);
		  	// console.log(roomsBehavior[i]['room'] === setBotRoom);
		  	if (roomsBehavior[i]['room'] === setBotRoom) {
		  		roomsBehavior[i]['bot'] = setBotIndex;
		  		roomsBehavior[i]['livechatID'] = '';
		  	}
		}
		console.log('-------------------------');
		console.log(roomsBehavior);
		console.log('-------------------------');
	});

	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data, currentRoom) {
		var chathistory = {};
		console.log('--------------------------------anson kung');
		console.log(roomsBehavior);
		console.log('--------------------------------anson kung');
		console.log(currentRoom);
		console.log('--------------------------------anson kung');
		for (var i = 0, length = roomsBehavior.length; i < length; i++) {
				
		  	if (roomsBehavior[i]['room'] === currentRoom) {
		  		bot = roomsBehavior[i]['bot'];
		  		livechatID = roomsBehavior[i]['livechatID'];

		console.log('--------------------------------anson kung');
		console.log(bot);
		console.log('--------------------------------anson kung');
		  	}
		}
		chathistory['timestamp'] = Date.now();
		if (bot) {
			// we tell the client to execute 'updatechat' with 2 parameters
			io.sockets.in(socket.room).emit('updatechat', socket.role, data, chathistory['timestamp']);
			var request = require('request');
			request('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/06a1b1fb-880c-4d6d-9d1d-6ab49e1caf54?subscription-key=85104b00ebda46949246c9828ee9f281&verbose=true&timezoneOffset=0&q=' + data, function (error, response, body) {
			    if (!error && response.statusCode == 200) {
			    	// console.log(body);
			    	console.log('testing anson');
			    	obj = JSON.parse(body);
    				console.log(obj.topScoringIntent.intent);
    				var botmessage;
    				if (obj.topScoringIntent.intent === 'greeting') {
    					botmessage = 'hello';
    				} else {
    					botmessage = 'sorry';
    				}
					var chathistorybot = {};
					chathistorybot['timestamp'] = Date.now();
					chathistorybot['role'] = 'bot';
					chathistorybot['message'] = botmessage;

					io.sockets.in(socket.room).emit('updatechat', 'bot', botmessage, chathistorybot['timestamp']);

					allchathistory[socket.room].push(chathistorybot);
					// console.log(allchathistory);
			     }
			})
		} else {
			// we tell the client to execute 'updatechat' with 2 parameters
			io.sockets.in(socket.room).emit('updatechat', socket.role, data, chathistory['timestamp']);
			console.log('---------------------------------------------------------------------------');
			console.log(data);
			console.log(livechatID);
			console.log('---------------------------------------------------------------------------');
			var request = require('request');
			var messageJson = {
				"message": data + "\n", 
				"contentType": "text/plain"
			};

			request({
			    url: "http://ctil-web-demo.cloudapp.net/I3Root/Server1/websvcs/chat/sendMessage/" + livechatID,
			    method: "POST",
			    json: true,   // <--Very important!!!
			    body: messageJson
			}, function (error, response, body){

			});
		}

		chathistory['role'] = socket.role;
		chathistory['message'] = data;

		allchathistory[socket.room].push(chathistory);
					// console.log(allchathistory);

	});
	

	// start a cic chat
	socket.on('startchat', function (data, room) {
		// console.log(data);
		var request = require('request');
		var clientjson = {
			"supportedContentTypes": "text/plain", 
			"participant": {"name": data, "credentials": ""}, 
			"transcriptRequired": false, 
			"emailAddress": null, 
			"target": "CTIL_WebChat_Demo1", 
			"targetType": "Workgroup", 
			"language": "en-us", 
			"clientToken": "deprecated"
		};

		request({
		    url: "http://ctil-web-demo.cloudapp.net/I3Root/Server1/WebSvcs/chat/start",
		    method: "POST",
		    json: true,
		    body: clientjson
		}, function (error, response, body){
			console.log(body);
			console.log(body.chat);
	        if (!error && response.statusCode == 200) {
	            console.log('----------------------');
	            console.log(body.chat.participantID);
	            console.log(room);
	            console.log('----------------------');
	            socket.emit('start', body.chat.participantID);

				for (var i = 0, length = roomsBehavior.length; i < length; i++) {
				  	if (roomsBehavior[i]['room'] === room) {
				  		roomsBehavior[i]['livechatID'] = body.chat.participantID;
				  		socket.livechatID = body.chat.participantID;
				  	}
				}

				console.log(roomsBehavior);
				var request = require('request');
				setInterval(function(){ 
					var request = require('request');

					request({
					    url: 'http://ctil-web-demo.cloudapp.net/I3Root/Server1/WebSvcs/chat/poll/' + body.chat.participantID,
					    method: "GET",
					    json: true,
					    body: clientjson
					}, function (errorPoll, responsePoll, bodyPoll){
				    	// console.log(bodyPoll.chat.events); // view all log

				    		console.log(bodyPoll.chat.events);
						for (var i = 0, length = bodyPoll.chat.events.length; i < length; i++) {
							console.log(bodyPoll.chat.events[i].type);
							console.log(bodyPoll.chat.events[i].type === 'text');
							console.log(bodyPoll.chat.events[i].participantType === 'agent');
				    		if (bodyPoll.chat.events[i].type === 'text') {
				    			if (bodyPoll.chat.events[i].participantType === 'Agent') {
				    				var sendToClientMessage = bodyPoll.chat.events[i].value;

						    		var chathistory = {}
									chathistory['timestamp'] = Date.now();
									chathistory['role'] = 'agent';
									chathistory['message'] = sendToClientMessage;
									io.sockets.in(socket.room).emit('updatechat', chathistory['role'], chathistory['message'], chathistory['timestamp']);

									allchathistory[socket.room].push(chathistory);
				    			}
				    		}

						}
				    	// if (bodyPoll.chat.events.type === 'text') {

				    	// }
					});
				}, 2000);
	        }
		});
	});
	
	socket.on('switchRoom', function(newroom){
		socket.leave(socket.room);
		socket.join(newroom);
		// socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
		// sent message to OLD room
		// socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
		// update socket session room title
		socket.room = newroom;
		// socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
		console.log(allchathistory[newroom]);
		socket.emit('updaterooms', rooms, newroom, names, roles, allchathistory[newroom]);
	});
	

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);

		var index = rooms.indexOf(socket.token);
		remove(names, names[index]);
		remove(roles, roles[index]);
		remove(rooms, socket.token);

	  	for (var key in roomsBehavior){
		    if (roomsBehavior[key]['room'] === socket.token) {
				remove(roomsBehavior,key);
		    }
		}
		delete allchathistory[socket.token];
		// echo globally that this client has left
		// socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');

		// Exit a chat from cic
		console.log(socket.livechatID);

		socket.leave(socket.room);
	});
});

function remove(array, element) {
    const index = array.indexOf(element);
    array.splice(index, 1);
}
