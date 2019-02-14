var socket = io();


var movement = {
    up: false,
    down: false,
    left: false,
    right: false
};

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
            break;
    }
});

// document.addEventListener('keydown', function(event) {
    
//     console.log("before if ", fire);

//     if (fire == false && event.keyCode == 32) {
//         fire = true;
//         socket.emit('new fire');
//         console.log("Fired! ", fire);
//     }
// });
var canvas = document.getElementById('canvas');
var CANVAS_WIDTH = 800;
var CANVAS_HEIGHT = 600;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
var ctx = canvas.getContext('2d');
var circleRadius = 10;
var boxRadius = 15;
var gunLength = 26;
var gunWidth = 4;
var bulletSize =3;
var UpdateBulletCycle = 10;
var frame = 0;
var moveRate = 25;


socket.emit('new player');

setInterval(function() {
    socket.emit('movement', movement);
}, 1000 / moveRate);


var drawScore = function(score) {
    
    ctx.font = "16px Arial";
    ctx.fillStyle = "#FF4B3A";
    ctx.fillText("Kills: "+ score, 8, 20);
}

var drawInfo = function(armor) {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#322985";
    if (armor > 0) {
        ctx.fillText("Armor: +"+ armor, 80, 20);
    } else {
        ctx.fillText("Armor: 0", 80, 20);
    }
}

var drawBullet = function(x, y){
  if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) return;
  ctx.beginPath();
  ctx.arc(x,y,bulletSize,0,2*Math.PI);
  ctx.fillStyle = "black";
  ctx.fill();
}

var drawTank = function(x, y, dir, color, armor){
  ctx.beginPath();
  ctx.rect(x-boxRadius, y-boxRadius, boxRadius*2, boxRadius*2);
  ctx.fillStyle = "#D6EFFF";
  ctx.stroke();
  ctx.fill();
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

   
  ctx.beginPath();
  ctx.arc(x,y,circleRadius,0,2*Math.PI);
  ctx.fillStyle = color;
  ctx.fill();

  if (dir =='left'){
  	ctx.rect(x-gunLength, y-gunWidth/2, gunLength, gunWidth);
  } else if (dir=='right'){
  	ctx.rect(x, y-gunWidth/2, gunLength, gunWidth);
  } else if (dir=='up') {
  	ctx.rect(x-gunWidth/2, y-gunLength, gunWidth, gunLength);
  } else {
  	ctx.rect(x-gunWidth/2, y, gunWidth, gunLength);
  }
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fill();
}


socket.on('state', function(players) {
    // console.log(players);
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    // drawScore(players[socket[id]].kills);

    
    for (var id in players) {
        var player = players[id];
        
        if (players[socket.id] != undefined){
            drawScore(players[socket.id].kills);
            drawInfo(players[socket.id].armor);
        }
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