var gamePiece;
var canvas;
var dropZone;
var music;
var currTime = 0;
var prevTime = 0;
var platforms;
var timer;

window.onload = function(){
	gameIsRunning = false;
	canvas = document.getElementById("Game");
	dropZone = document.getElementById('drop_zone');
	dropZone.addEventListener('dragover', handleDragOver, false);
	dropZone.addEventListener('drop', handleFileSelect, false);
	gamePiece = new component(30, 30, "red");
	startGame();
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
	platforms.push(new generatePlatform(canvas.width/2, 180, 300));
	gameArea.keys = [];
	gameArea.start();
}

var gameArea = {
	start : function() {
		canvas.width = 1000;
		canvas.height = 600;
		this.context = canvas.getContext("2d");
	    window.addEventListener('keydown', function (e) {
            gameArea.keys = (gameArea.keys || []);
            gameArea.keys[e.keyCode] = true;
        })
        window.addEventListener('keyup', function (e) {
            gameArea.keys[e.keyCode] = false; 
        })
		gameArea.run();
	},
	clear : function(){
		this.context.clearRect(0, 0, canvas.width, canvas.height);
	},
	update : function(dt) {
		//Clear screen
		gameArea.clear();
		
		//Garbage collection
		deletePlatforms(platforms);
		
		//Add platform
		if (currTime - prevTime > 500) {
			platforms.push(new generatePlatform(gamePiece.x+Math.random()*100+150, Math.random()*50+300, 100, 30, 'E'));
			prevTime = currTime;
		}
		
		
		gamePiece.speedX = 0;
		gamePiece.speedY += (gamePiece.onGround ? -gamePiece.speedY : Math.min(0.339, 2));
		
		if (gameArea.keys && gameArea.keys[32] && gamePiece.onGround) {gamePiece.speedY = -4; }
		if (gameArea.keys && gameArea.keys[88] && !gamePiece.onGround) {
			while (!gamePiece.onGround && !(gamePiece.y + gamePiece.height > canvas.height)) {
				gamePiece.speedY = 1;
				gamePiece.update(dt);
			}
		}
		if (gameArea.keys && gameArea.keys[37]) {movePlatforms(platforms, .9); }
		if (gameArea.keys && gameArea.keys[39]) {movePlatforms(platforms, -.9); }
		
		
		for (i = 0; i < platforms.length; i++) {
			platforms[i].update(dt);
			platforms[i].draw();
		}
		
		gamePiece.update(dt); 
		gamePiece.draw();
	},
	run : function() {
		requestAnimationFrame(gameArea.run);
		var now = Date.now(), dt = (now - (currTime || now)) * 0.15;
		gameArea.update(dt);
		currTime = now;
	
	}
}

function component(width, height, color) {
    this.width = width;
    this.height = height;
   // this.speedX = 0;
    this.speedY = 0;
	this.onGround = true;
    this.x = (canvas.width-this.width)/2;
    this.y = 120; 
    this.draw = function() {
        ctx = gameArea.context;
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    this.update = function(dt) {
        this.y += this.speedY * dt; 
		
		this.onGround = false;
		for (i = 0; i < platforms.length; i++) {
			if (isOnGround(gamePiece, platforms[i])) {
				this.onGround = true;
				platforms[i].setColor("blue");
			} else {
				platforms[i].setColor("green");
			}
		}
		
		if (this.y + this.height > canvas.height) {
			alert("Game over\nScore = "+timer);
			gameOver();
		}
    } 
	this.restart = function() {
		gamePiece.x = (canvas.width-this.width)/2;
		gamePiece.y = 120;
	//	gamePiece.speedX = 0;
		gamePiece.speedY = 0;
		gamePiece.onGround = true;
	}
}

function isOnGround(myPiece, platform) {
	if (myPiece.x + myPiece.width < platform.x || myPiece.x > platform.x + platform.width) {return false; }
	
	if (myPiece.y + myPiece.height >= platform.y && myPiece.y + myPiece.height <= platform.y + platform.height) {
		myPiece.y = platform.y - myPiece.height;
		return true;
	}
	
	return false;
}

function movePlatforms(arr, spd) {
	for (i = 0; i < arr.length; i++) {
		platforms[i].x -= spd;
	}
}

function deletePlatforms(arr) {
	for (i = arr.length - 1; i >= 0; i--) {
		if (platforms[i].x + platforms[i].width < 0) {
			arr.splice(i, 1);
		}
	}
}

function generatePlatform(x, y, width, volume, note) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = 15;
	this.color = "green";
	this.volume = volume;
	this.note = note;
	this.update = function(dt){
		this.x -= 1.3 * dt;
	}
	this.draw = function() {
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