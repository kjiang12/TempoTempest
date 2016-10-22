var gamePiece;
var canvas;
var dropZone;
var music;

window.onload = function(){
	canvas = document.getElementById("Game");
	dropZone = document.getElementById('drop_zone');
	dropZone.addEventListener('dragover', handleDragOver, false);
	dropZone.addEventListener('drop', handleFileSelect, false);
	gamePiece = new component(30, 30, "red");
}

function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    music = evt.dataTransfer.files[0]; // FileList object.
    document.getElementById('Title').innerHTML = '<h1>' + "Now playing - " + music.name.split(".")[0] + '</h1>';
	dropZone.style.display = 'none';
	startGame();
 }

function handleDragOver(evt) {
	evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}
  
function startGame() {
	gamePiece.restart();
	timer = 0;
	platforms = [];
	platforms.push(new generatePlatform(10, 180, 300));
	gameArea.keys = [];
	gameArea.start();
}
var firstRun = true;
var gameArea = {
	start : function() {
		canvas.width = 1000;
		canvas.height = 720;
		this.context = canvas.getContext("2d");
		if (firstRun) {
			this.interval = setInterval(updateGameArea, 5);
			firstRun = false;
		}
	    window.addEventListener('keydown', function (e) {
            gameArea.keys = (gameArea.keys || []);
            gameArea.keys[e.keyCode] = true;
        })
        window.addEventListener('keyup', function (e) {
            gameArea.keys[e.keyCode] = false; 
        })
	},
	clear : function(){
		this.context.clearRect(0, 0, canvas.width, canvas.height);
	}
}

function component(width, height, color) {
    this.width = width;
    this.height = height;
    this.speedX = 0;
    this.speedY = 0;
	this.onGround = true;
    this.x = 10;
    this.y = 120; 
    this.update = function() {
        ctx = gameArea.context;
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    this.newPos = function() {
        this.x += this.speedX;
        this.y += this.speedY; 
		
		this.onGround = false;
		for (i = 0; i < platforms.length; i++) {
			if (isOnGround(gamePiece, platforms[i])) {
				this.onGround = true;
				platforms[i].setColor("blue");
			} else {
				platforms[i].setColor("green");
			}
		}
		if (this.onGround) {
			this.x -= 1.3;
		}
		
		if (this.y + this.height > canvas.height) {
			gameOver();
		}
    } 
	this.restart = function() {
		gamePiece.x = 10;
		gamePiece.y = 120;
		gamePiece.speedX = 0;
		gamePiece.speedY = 0;
		gamePiece.onGround = true;
	}
}

var platforms;
var timer;
function updateGameArea() {
	if (timer % 150 == 0) {
		platforms.push(new generatePlatform(gamePiece.x+Math.random()*100+150, Math.random()*50+300, 100, 30, 'E'));
	}
	timer++;
    gameArea.clear();
    gamePiece.speedX = 0;
	
	for (i = 0; i < platforms.length; i++) {
		platforms[i].update();
	}

	if (gamePiece.onGround) {
		gamePiece.speedY = 0;
	} else {
		gamePiece.speedY += .0339;
	}
	if (gameArea.keys && gameArea.keys[38] && gamePiece.onGround) {gamePiece.speedY = -2; }
	if (gameArea.keys && gameArea.keys[40] && !gamePiece.onGround) {gamePiece.speedY = 5; }
    if (gameArea.keys && gameArea.keys[37]) {gamePiece.speedX = -3.5; }
    if (gameArea.keys && gameArea.keys[39]) {gamePiece.speedX = 3.5; }
	
    gamePiece.newPos(); 
    gamePiece.update();
}

function isOnGround(myPiece, platform) {
	if (myPiece.x + myPiece.width < platform.x || myPiece.x > platform.x + platform.width) {return false; }
	
	if (myPiece.y + myPiece.height >= platform.y && myPiece.y + myPiece.height <= platform.y + platform.height) {
		myPiece.y = platform.y - myPiece.height;
		return true;
	}
	
	return false;
}

function generatePlatform(x, y, width, volume, note) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = 15;
	this.color = "green";
	this.volume = volume;
	this.note = note;
	this.update = function() {
		this.x -= 1.3;
		ctx = gameArea.context;
		ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
	}
	this.setColor = function(color) {
		this.color = color;
	}
}

function gameOver() {
	gameArea.addEventListener("click", startGame());
}