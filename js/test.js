var myGamePiece;
var canvas;
var dropZone;
var music;
var gameIsRunning;
var arr = [];
var currTime = 0;
var prevTime = 0;

window.onload = function(){
	gameIsRunning = false;
	canvas = document.getElementById("Game");
	dropZone = document.getElementById('drop_zone');
	dropZone.addEventListener('dragover', handleDragOver, false);
	dropZone.addEventListener('drop', handleFileSelect, false);
	arr.push(new generatePlatform(10, 180, 300));
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
	myGamePiece = new component(30, 30, "red", 10, 120);
	myGameArea.start();
}

var myGameArea = {
	start : function() {
		canvas.width = 1000;
		canvas.height = 720;
		this.context = canvas.getContext("2d");
	    window.addEventListener('keydown', function (e) {
            myGameArea.keys = (myGameArea.keys || []);
            myGameArea.keys[e.keyCode] = true;
        });
        window.addEventListener('keyup', function (e) {
            myGameArea.keys[e.keyCode] = false; 
        });
		myGameArea.run();
	},
	clear : function(){
		this.context.clearRect(0, 0, canvas.width, canvas.height);
	},
	update : function(dt) {
		//Clear screen
		myGameArea.clear();
		
		//Garbage collection
		for(var i = arr.length - 1; i > 0; i--){
			if(arr[i].outOfBounds()){
				arr.splice(i, 1);
			}
		}
		
		//Add platform
		if (currTime - prevTime > 500) {
			arr.push(new generatePlatform(myGamePiece.x+Math.random()*100+150, Math.random()*50+300, 100, 30, 'E'));
			prevTime = currTime;
		}
		
		
		myGamePiece.speedX = 0;
		myGamePiece.speedY += (myGamePiece.onGround ? -myGamePiece.speedY : Math.min(0.339, 2));
		
		if(myGameArea.keys){
			if(myGameArea.keys[38] && myGamePiece.onGround) {myGamePiece.speedY = -4; }
			if(myGameArea.keys[40] && !myGamePiece.onGround) {myGamePiece.speedY = 3; }
			if(myGameArea.keys[37]) {myGamePiece.speedX = -2; }
			if(myGameArea.keys[39]) {myGamePiece.speedX = 2; }
		}
		
		
		myGamePiece.update(dt); 
		myGamePiece.draw();
		
		for (i = 0; i < arr.length; i++) {
			arr[i].update(dt);
			arr[i].draw();
		}
	},
	run : function() {
		requestAnimationFrame(myGameArea.run);
		var now = Date.now(), dt = (now - (currTime || now)) * 0.17;
		myGameArea.update(dt);
		currTime = now;
	
	}
}

function component(width, height, color, x, y) {
    this.width = width;
    this.height = height;
    this.speedX = 0;
    this.speedY = 0;
	this.onGround = true;
    this.x = x;
    this.y = y; 
    this.draw = function() {
        ctx = myGameArea.context;
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    this.update = function(dt) {
        this.x += this.speedX * dt;
        this.y += this.speedY * dt; 
		
		this.onGround = false
		;
		for (i = 0; i < arr.length; i++) {
			if (isOnGround(myGamePiece, arr[i])) {
				this.onGround = true;
				arr[i].setColor("blue");
			} else {
				arr[i].setColor("green");
			}
		}
		if (this.onGround) {
			this.x -= 1.3 * dt;
		}
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
		ctx = myGameArea.context;
		ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
	}
	this.setColor = function(color) {
		this.color = color;
	}
	this.outOfBounds = function(){
		if (this.x + this.width < 0){
			return true;
		}
		return false;
	}
}