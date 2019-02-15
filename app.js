// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
var randomColor = require('randomcolor');


app.set('port', 8080);
app.use('/static', express.static(__dirname + '/static'));

//Global
var CANVAS_WIDTH = 1000;
var CANVAS_HEIGHT = 600;
var frameRate = 80;

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
var bulletSpeed = 12; 
var blastRadius = 22;
var MAX_LIVE_TANK_COUNT = 10;
var SPAWN_DIST = blastRadius*3;
var rockWidth = 10;
var rockCollision = 20;
var MAP_NAME = 'first';


var gameMaps = {
  first: [[150, 100, 8, 8],
        [150, 400, 8, 8],
        [780, 100, 8, 8],
        [780, 400, 8, 8]],
};

var generateObstacle = function(mapName){
  var coords = gameMaps[mapName];
  var mapGridPoints = [];
  for (var i=0; i<coords.length; i++){
    var startX = coords[i][0];
    var startY = coords[i][1];
    mapGridPoints.push([startX+coords[i][2]/2*rockWidth, startY+coords[i][3]/2*rockWidth, coords[i][2]/2*rockWidth, coords[i][3]/2*rockWidth]);
  }
  return mapGridPoints;
}

var currentObstacle = generateObstacle(MAP_NAME);

// console.log(currentObstacle);
var updateBullets = function(){
  for (var id in players) {
    var player = players[id];
    if (player.display == true && player.bulletDir != '' && player.fire == true){
      var bdir = players[id].bulletDir;
      var spd = players[id].bullet[2];
      if (bdir === 'left'){
        player.bullet[0] -= spd;
      } else if (bdir === 'right') {
        player.bullet[0] += spd;
      } else if (bdir === 'up') {
        player.bullet[1] -= spd;
      } else if (bdir === 'down') {
        player.bullet[1] += spd;
      } 
      // console.log("bullet = ", player.bullet[0], player.bullet[1])
      //check if bullet hit obstables
      for (var i=0; i<currentObstacle.length; i++){
          if ((Math.abs(player.bullet[0] - currentObstacle[i][0]) <= currentObstacle[i][2]) &&
            (Math.abs(player.bullet[1] - currentObstacle[i][1]) <= currentObstacle[i][3])) {
            player.bulletDir = '';
            player.fire = false;  
            console.log("hit obstacle!");
            return true;
          }
      }
      //check if bullet is outside
      if (player.bullet[0] < 0 || player.bullet[0] > CANVAS_WIDTH || 
      player.bullet[1] < 0 || player.bullet[1] > CANVAS_HEIGHT){
        player.bulletDir = '';
        player.fire = false;
      }
    }
  }
  return false;
}


var collision = function(){
  var currentPlayerLocations = [];
  var isCollision = false;
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
          isCollision = true;
          if (players[player[2]].armor == 0){
            players[player[2]].display = false;
            //update score (maybe)
            players[id].kills += 1;
            //reward
            players[id].armor = Math.min(5, players[id].armor+1);            
            
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
  return isCollision;
}

var initGunDir = function(){
  var directions = ['up', 'down', 'left', 'right'];
  return directions[Math.floor(Math.random()*4)];
}

var getLiveTanks = function(){
  var res = [];
  for (var id in players){
    if (players[id].display == true){
      res.push([players[id].x, players[id].y, id]);
    }
  }
  return res;
}
var isValid = function(x, y, allTanks){
  for (var i=0; i<allTanks.length; i++){
    var el = allTanks[i];
    // console.log((el[0]-x)*(el[0]-x) + (el[1]-y)*(el[1]-y));
    if ((el[0]-x)*(el[0]-x) + (el[1]-y)*(el[1]-y)<=SPAWN_DIST*SPAWN_DIST) return false;
  }
  return true;
}

var reachMaxTankCount = function(){
  if (getLiveTanks().length>=MAX_LIVE_TANK_COUNT){
    return true;
  }
  return false;
}
     
var numPlayers = -1;
io.on('connection', function(socket) {
  console.log('user connected.')
  numPlayers += 1;
  socket.on('new player', function() {
    var locs = getLiveTanks();
    var posX = Math.floor(Math.random()*(CANVAS_WIDTH-10))+5;
    var posY = Math.floor(Math.random()*(CANVAS_HEIGHT-10))+5;
    while (isValid(posX, posY, locs) == false){
      posX = Math.floor(Math.random()*(CANVAS_WIDTH-10))+5;
      posY = Math.floor(Math.random()*(CANVAS_HEIGHT-10))+5;
      // console.log("checking");
      // console.log(posX, posY);
      // console.log(locs);
    };
    players[socket.id] = {
      // x: Math.floor(Math.random()*(CANVAS_WIDTH-10))+5,
      // y: Math.floor(Math.random()*(CANVAS_HEIGHT-10))+5,
      x: posX,
      y: posY,
      color: randomColor({
        luminosity: 'bright',
        format: 'rgb' // e.g. 'rgb(225,200,20)'
      }),
      gun: initGunDir(),
      bullet: [-100, -100, bulletSpeed],
      bulletDir: '',
      fire: false,
      display: true,
      kills: 0,
      armor: 0,
    };
       // console.log(players);
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
    numPlayers-=1;
  });
});

setInterval(function() {
  updateBullets();
  players.isCollision = collision();
  players.numPlayers = numPlayers;
  io.sockets.emit('state', players);
}, 1000 / frameRate);




