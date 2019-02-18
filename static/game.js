var socket = io();
var canvas = document.getElementById('canvas');
var CANVAS_WIDTH = 1000;
var CANVAS_HEIGHT = 600;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
var ctx = canvas.getContext('2d');
var circleRadius = 8;
var boxRadius = 13;
var gunLength = 25;
var gunWidth = 4;
var bulletSize =3;
var UpdateBulletCycle = 10;
var frame = 0;
var moveRate = 25;
var trailWidth = 6;
var trailLength = trailWidth+boxRadius;
var tankManLoc = circleRadius/4;
var tankManSize = 2;
// var rockWidth = 10;
var rockLineWidth = 3;
var MAP_NAME = 'test';
var grassHeight = 10;
var grassWidth = 5;



var movement = {
    up: false,
    down: false,
    left: false,
    right: false
};

var soundData = {
  shoot: {
    sound: new Howl({
      src: ['static/sounds/suspension.mp3']
    }),
    color: '#9b59b6'
  },
  blast: {
    sound: new Howl({
    src: ['static/sounds/glimmer.mp3']
    }),
    color: '#8e44ad'
  }

};

// var drawRockBlock = function(x, y, numX, numY){

//   ctx.lineWidth = rockLineWidth;
//   for (var i=0; i< numX; i++){
//     for (var j=0; j<numY; j++){
//       drawrocks(x+i*rockWidth,y+j*rockWidth);
//     }
//   }
//   ctx.lineWidth = 1;
// }

var gameMaps = {
  none: [[]],
  first: [[150, 100, 8, 8],
        [150, 400, 8, 8],
        [780, 100, 8, 8],
        [780, 400, 8, 8]],
  second: [[400, 200, 2, 30]],
  simple: [[300, 300, 20, 20]],
  test: [[100, 100, 100, 100],
        [CANVAS_WIDTH-200, 100, 100, 100],
        [100, CANVAS_HEIGHT-200, 100, 100],
        [CANVAS_WIDTH-200, CANVAS_HEIGHT-200, 100, 100]],
};

var generateMap = function(mapName){
  var coords = gameMaps[mapName];
  ctx.lineWidth = rockLineWidth;
  for (var i=0; i<coords.length; i++){
    drawrock(coords[i][0], coords[i][1], coords[i][2], coords[i][3]);
  }
  ctx.lineWidth = 1;
}
var grassLocations = [[100, 50], [300, 600], [250, 250], [500, 500], [900, 550], [630, 100],
                     [500, 500], [50, 500], [400, 590], [890, 300]];

var addGrass = function(numGrass){
    grassLocations.forEach(function(el){
        drawGrass(el[0], el[1]);
    });
}




var makeSound = function(type){
  soundData[type].sound.play();
}


document.addEventListener('keydown', function(event) {
    // movement = {
    //     up: false,
    //     down: false,
    //     left: false,
    //     right: false
    // };
    switch (event.keyCode) {
        case 65: // A
            movement.left = true;
            break;
        case 87: // W
            movement.up = true;
            break;
        case 68: // D
            movement.right = true;
            break;
        case 83: // S
            movement.down = true;
            break;
    }
});
document.addEventListener('keyup', function(event) {
    switch (event.keyCode) {
        case 65: // A
            movement.left = false;
            break;
        case 87: // W
            movement.up = false;
            break;
        case 68: // D
            movement.right = false;
            break;
        case 83: // S
            movement.down = false;
            break;
    }
});

document.addEventListener('keydown', function(event) {

    switch (event.keyCode) {
        case 37: // left arrow
            socket.emit('gun', 'left');
            break;
        case 38: // up arrow
            socket.emit('gun', 'up');
            break;
        case 39: // right arrow
            socket.emit('gun', 'right');
            break;
        case 40: // down arrow
            socket.emit('gun', 'down');
            break;
        case 32:
            socket.emit('new fire');
            // fire = true;
            // makeSound("shoot");
            break;
    }
});


socket.emit('new player');

setInterval(function() {
    socket.emit('movement', movement);
}, 1000 / moveRate);


var drawScore = function(score) {
    
    ctx.font = "16px Arial";
    ctx.fillStyle = "#FF4B3A";
    ctx.fillText("Kills: "+ score, 8, 20);
}

var drawArmor = function(armor) {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#322985";
    if (armor == 5) {
        ctx.fillStyle = "#B00AB7";
        ctx.fillText("Armor: MAXED", 80, 20);
    } else if (armor > 0) {
        ctx.fillText("Armor: +"+ armor, 80, 20);
    } else {
        ctx.fillText("Armor: 0", 80, 20);
    }
}

var drawInfo = function(numPlayers){
    ctx.font = "16px Arial";
    ctx.fillStyle = "green";
    ctx.fillText("Num Players: "+ numPlayers, CANVAS_WIDTH - 150, 20);  
}

var drawBullet = function(x, y){
  if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) return;
  ctx.beginPath();
  ctx.arc(x,y,bulletSize,0,2*Math.PI);
  ctx.fillStyle = "black";
  ctx.fill();
}

var drawrock = function(x, y, rockWidth, rockWidth){
  ctx.beginPath();
  ctx.rect(x, y, rockWidth, rockWidth);
  ctx.fillStyle = "#4C5159";
  ctx.stroke();
  ctx.fill();
}

var drawGrass = function(x, y){
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y-grassHeight);
    ctx.lineTo(x+grassWidth, y-grassHeight/2);
    ctx.lineTo(x+2*grassWidth, y-grassHeight);
    ctx.lineTo(x+3*grassWidth, y-grassHeight/2);
    ctx.lineTo(x+4*grassWidth, y-grassHeight);
    ctx.lineTo(x+4*grassWidth, y);
	ctx.fillStyle = "#1EAB45";
    ctx.fill();
    ctx.closePath();
}

var drawTank = function(x, y, dir, color, armor){
  //tank trail
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (dir =='left' || dir=='right'){
    ctx.rect(x-boxRadius-trailWidth, y-boxRadius-trailWidth, trailLength*2, trailWidth);
    ctx.rect(x-boxRadius-trailWidth, y+boxRadius, trailLength*2, trailWidth);
  } else {
    ctx.rect(x-boxRadius-trailWidth, y-boxRadius-trailWidth, trailWidth, trailLength*2);
    ctx.rect(x+boxRadius, y-boxRadius-trailWidth, trailWidth, trailLength*2);
  }
  ctx.fillStyle = color;
  ctx.stroke();
  ctx.fill();

  //tank body
  ctx.beginPath();
  ctx.rect(x-boxRadius, y-boxRadius, boxRadius*2, boxRadius*2);
  ctx.fillStyle = "#D6EFFF";
  ctx.stroke();
  ctx.fill();
    if (armor>=5){
        ctx.beginPath();
        ctx.rect(x-boxRadius+3, y-boxRadius+3, boxRadius*2-6, boxRadius*2-6);
        ctx.stroke();
    } 
    if (armor>=3){
        ctx.beginPath();
        ctx.rect(x-boxRadius+2, y-boxRadius+2, boxRadius*2-4, boxRadius*2-4);
        ctx.stroke();
    }  
    if (armor>=1){
        ctx.beginPath();
        ctx.rect(x-boxRadius+1, y-boxRadius+1, boxRadius*2-2, boxRadius*2-2);
        ctx.stroke();
    } 

  //tank control tower
  ctx.beginPath();
  ctx.arc(x,y,circleRadius,0,2*Math.PI);
  ctx.fillStyle = color;
  ctx.stroke();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x-tankManLoc,y-tankManLoc,tankManSize,0,2*Math.PI);
  ctx.fillStyle = "#030008";
  ctx.stroke();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x-tankManLoc,y-tankManLoc,tankManSize,0,2*Math.PI);
  ctx.fillStyle = "#030008";
  ctx.stroke();
  ctx.fill();

  //tank gun
  if (dir =='left'){
  	ctx.rect(x-gunLength, y-gunWidth/2, gunLength-circleRadius, gunWidth);
  } else if (dir=='right'){
  	ctx.rect(circleRadius + x, y-gunWidth/2, gunLength-circleRadius, gunWidth);
  } else if (dir=='up') {
  	ctx.rect(x-gunWidth/2, y-gunLength, gunWidth, gunLength-circleRadius);
  } else {
  	ctx.rect(x-gunWidth/2, y+circleRadius, gunWidth, gunLength-circleRadius);
  }
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fill();
}



socket.on('state', function(players) {
    // console.log(players);
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    // drawScore(players[socket[id]].kills);
    if (players.hitObstacle) {
      makeSound("blast");
      console.log("make a blast sound");
    }
    if (players.isCollision) makeSound('shoot');

    
    for (var id in players) {
        var player = players[id];
        
        if (players[socket.id] != undefined){
            drawScore(players[socket.id].kills);
            drawArmor(players[socket.id].armor);
            drawInfo(players.numPlayers);
        }

        //generate map
        generateMap(MAP_NAME);

        //add grass:
        addGrass(10);
        
        //display tanks
        if (player.display){
            drawTank(player.x, player.y, player.gun, player.color, player.armor);
        } 



              
        //display moving bullets for alive players
        if (player.display == true && player.fire == true && player.bulletDir != ''){
            drawBullet(player.bullet[0], player.bullet[1]);
        }
    }
});