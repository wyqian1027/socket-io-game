// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
var randomColor = require('randomcolor');
// var {Howl, Howler} = require('howler');

app.set('port', 8080);
app.use('/static', express.static(__dirname + '/static'));

//Global
var CANVAS_WIDTH = 800;
var CANVAS_HEIGHT = 600;
var frameRate = 100;

// Routing
app.get('/', function(req, res) {
//   res.sendFile(path.join(__dirname, 'index.html'));
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Starts the server.
server.listen(8080, function() {
  console.log('Starting server on port 8080');
});

// Add the WebSocket handlers
var players = {};
var bulletSpeed = 20; 
var blastRadius = 18;

var updateBullets = function(){
  for (var id in players) {
    var player = players[id];
    if (player.display == true && player.bulletDir != '' && player.fire == true){
      var bdir = players[id].bulletDir;
      var spd = players[id].bullet[2];
      if (bdir === 'left'){
        players[id].bullet[0] -= spd;
      } else if (bdir === 'right') {
        players[id].bullet[0] += spd;
      } else if (bdir === 'up') {
        players[id].bullet[1] -= spd;
      } else if (bdir === 'down') {
        players[id].bullet[1] += spd;
      } 
      //check if bullet is outside
      if (player.bullet[0] < 0 || player.bullet[0] > CANVAS_WIDTH || 
      player.bullet[1] < 0 || player.bullet[1] > CANVAS_HEIGHT){
        player.bulletDir = '';
        player.fire = false;
        // console.log("bullet outside range");
        // console.log(player);
      }
    }
  }
}


var collision = function(){
  var currentPlayerLocations = [];
  //get all player locations
  for (var id in players){
    if (players[id].display == true) {
      currentPlayerLocations.push([players[id].x, players[id].y, id]);
    }
  }
  //iterate over all bullets from players alive
  for (var id in players){
    if (players[id].display == true && players[id].fire == true){
      var bulletX = players[id].bullet[0];
      var bulletY = players[id].bullet[1];
      //check if any blast radius satisfy
      currentPlayerLocations.forEach(function(player){
        if (player[2] != id &&(player[0] - bulletX)*(player[0] - bulletX) + (player[1] - bulletY)*(player[1] - bulletY) <= blastRadius*blastRadius) {
          //remove player if armor = 0
          if (players[player[2]].armor == 0){
            players[player[2]].display = false;
            //update score (maybe)
            players[id].kills += 1;
            //reward
            players[id].armor += 1;            
            
          } else {
            players[player[2]].armor -= 1;
          }
          //remove bullet
          players[id].bulletDir = '';
          players[id].fire = false;
          
        }
      });
    }
  }
}
     

io.on('connection', function(socket) {
  console.log('user connected.')
  // socket.on('remove player', function(playerId) {
  //   for (var id in players){
  //     if (id == playerId) players[id].display = false;
  //   };
  //   if (players[socket.id].bulletDir != '') {
  //     // players[socket.id].bullet = [-100, -100];
  //     players[socket.id].bulletDir = '';
  //   }
  // });
  socket.on('new player', function() {
    players[socket.id] = {
      x: Math.floor(Math.random()*(CANVAS_WIDTH-10))+5,
      y: Math.floor(Math.random()*(CANVAS_HEIGHT-10))+5,
      color: randomColor({
        luminosity: 'bright',
        format: 'rgb' // e.g. 'rgb(225,200,20)'
      }),
      gun: 'up',
      bullet: [-100, -100, bulletSpeed],
      bulletDir: '',
      fire: false,
      display: true,
      kills: 0,
      armor: 0,
    };
    console.log(players);
  });
  socket.on('new fire', function(){
    if (players[socket.id] != undefined && players[socket.id].display == true && players[socket.id].bulletDir === '') {
      players[socket.id].bullet = [players[socket.id].x, players[socket.id].y, bulletSpeed];
      players[socket.id].bulletDir = players[socket.id].gun;
      players[socket.id].fire = true;
      // console.log('new fire');
      // console.log(players[socket.id]);
    }
  });
  // socket.on('stop fire', function(){
  //   if (players[socket.id].bulletDir != '') {
  //     // players[socket.id].bullet = [-100, -100];
  //     players[socket.id].bulletDir = '';
  //     players[socket.id].fire = false;
  //     console.log("stop fire")
  //     console.log(players[socket.id]);
  //   }
  // });
  // socket.on('update bullet', function(){
  //   if (players[socket.id] === undefined) return;
  //   var bdir = players[socket.id].bulletDir;
  //   var spd = players[socket.id].bullet[2];
  //   if (bdir === 'left'){
  //     players[socket.id].bullet[0] -= spd;
  //   } else if (bdir === 'right') {
  //     players[socket.id].bullet[0] += spd;
  //   } else if (bdir === 'up') {
  //     players[socket.id].bullet[1] -= spd;
  //   } else if (bdir === 'down') {
  //     players[socket.id].bullet[1] += spd;
  //   } else {
  //     return;
  //   }
  // });
  socket.on('movement', function(data) {
    var player = players[socket.id] || {};
    //with boundary
    // if (data.left && player.x>=0) {
    //   player.x -= 5;
    // }
    // if (data.up && player.y>=0) {
    //   player.y -= 5;
    // }
    // if (data.right && player.x<=CANVAS_WIDTH-5) {
    //   player.x += 5;
    // }
    // if (data.down && player.y<=CANVAS_HEIGHT-5) {
    //   player.y += 5;
    // }
    //periodic
    if (data.left) {
      player.x -= 5;
      if (player.x < 0) player.x = CANVAS_WIDTH;
    }
    if (data.up) {
      player.y -= 5;
      if (player.y < 0) player.y = CANVAS_HEIGHT;
    }
    if (data.right) {
      player.x += 5;
      if (player.x > CANVAS_WIDTH) player.x = 0;
    }
    if (data.down) {
      player.y += 5;
      if (player.y > CANVAS_HEIGHT) player.y = 0;
    }
  });
  socket.on('gun', function(dir){
    players[socket.id]['gun'] = dir;
  });
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

setInterval(function() {
  updateBullets();
  collision();
  io.sockets.emit('state', players);
}, 1000 / frameRate);




