
//URL =  DOMAIN             PORT     PATH
//       mywebesite.com     :2000    /client/playerImg.png 


//File communication (Express)
    //Client ask server for a file (Ex: playerImg.png)

var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(2000);

//Package communication(Socket.IO)  
    //Client sends data to server (Ex: Input)
    //Server sends data to client (Ex: Monster position)

console.log("Server started");

var idCount = 0;

var GameObject = function () {
    
    var self = {
        x: 255,
        y: 450,
        speedX: 0,
        speedY: 0,
        id: ""
    }

        self.update = function()  {
            self.updatePos();
        }

        self.updatePos = function() {
            self.x += self.speedX;
            self.y += self.speedY; 
        }
        return self;
    
}


var Ball = function (size, xVel) {

    var self = GameObject();
    self.id = Math.random();
    self.size = size;

    self.acc = 0;

    self.x = Math.floor((Math.random() * 450) + 50);
    self.y = 0;

    speedX = xVel;
    speedY = 0;


    var inheritedUpdate = self.update;
    self.update = function () {

        self.acc += 9.8 + deltaTime;
        self.speedY = (1 - size + 5) * self.acc;

    }

    Ball.list[self.id] = self;

    return self;


}

Ball.list = {}

Ball.update = function () {

    var pack = [];

    for (var i in Ball.list) {
        var ball = Ball.list[i];
        ball.update()


        pack.push({
            ballSize: ball.size,
            x: ball.x,
            y: ball.y
        });
    }

    return pack;
}

var Player = function (id, connectionCount) {

        var self = GameObject();
        self.id = id;
        self.number ="" + connectionCount;
        self.rightKey = false;
        self.leftKey = false;
        self.spaceKey = false;
        self.maxSpeed = 10;
        self.isShooting = false;
    

        var inheritedUpdate = self.update;
        self.update = function () {

            if (self.x > 500) {
                self.x = 0;
            }
            if (self.x < 0) {
                self.y = 500;
            }

            self.updateSpeed();
            inheritedUpdate();
        }

    self.updateSpeed = function() {
        if (self.rightKey)
            self.speedX = self.maxSpeed;
        else if (self.leftKey)
            self.speedX = -self.maxSpeed;
        else
            self.speedX = 0;
    }
    Player.list[id] = self

    return self;
}

Player.list = {};

Player.update = function () {

    var pack = [];

    for (var i in Player.list) {
        var player = Player.list[i];
        player.update()

        if (player.spaceKey == true && player.isShooting == false) {
            player.isShooting = true;
            Bullet(player.x, player)
        }

        pack.push({
            number: player.number,
            x: player.x,
            y: player.y
        });
    }

    return pack;
}

Player.onConnect = function (socket) {

    //client is asking to connect
    socket.on('clientCnn', function (data) {
        console.log('Clinet Connected at: ' + data.time);
    });

    idCount++;

    var player = Player(socket.id, idCount);

    socket.on('keyPress', function (data) {
       
        if (data.inputId === 'right')
            player.rightKey = data.state;
        else if (data.inputId === 'left')
            player.leftKey = data.state;
        else if (data.inputId === 'space')
            player.spaceKey = data.state;

    });
}

Player.onDisconnect = function(socket) {
   
    delete Player.list[socket.id];

}



var Bullet = function (x, player) {

    var self =  GameObject();

    self.id = Math.random();
    self.speedY = -5;

    self.x = x;
    self.owner = player;

    self.toRemove = false;

    var inheritedUpdate = self.update;
    self.update = function () {
        self.update
        inheritedUpdate();
    }
    Bullet.list[self.id] = self;
    return self;
}

Bullet.list = {};

Bullet.update = function () {

    var pack = [];

    for (var i in Bullet.list) {
        var bullet = Bullet.list[i];
        bullet.update()


        if (bullet.y < 0){
            bullet.toRemove = true;
            bullet.owner.isShooting = false;
        }

        pack.push({
            x: bullet.x,
            y: bullet.y
        });
    }

    return pack;

}

var socketList = {};

var io = require('socket.io')(serv, {});

io.sockets.on('connection', function (socket) {

    console.log("new connection");


    socket.id = Math.random();
    socketList[socket.id] = socket;

    Player.onConnect(socket);

    socket.on('disconnect', function () {
        delete socketList[socket.id];
        Player.onDisconnect(socket);
    });


});

var lastUpdate = Date.now();
var deltaTime = Date.now();
var ballSpawnCountdown = 5;

//Update loop
setInterval(function () {

    var now = Date.now();
    deltaTime = now - lastUpdate;
    lastUpdate = now;

    ballSpawnCountdown -= deltaTime;
    if (ballSpawnCountdown <= 0)
    {
        Ball(5, 0)
    }

    var pack = {
        player: Player.update(),
        bullet: Bullet.update(),
        ball: Ball.update(),
    }

    for (var i in socketList) {
        var socket = socketList[i];
        socket.emit('newPos', pack);
    }

}, 1000 / 25);
