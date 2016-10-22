var gamePiece;
var canvas;
var dropZone;
var currTime = 0;
var prevTime = 0;
var startTime = 0;
var score;
var platforms;
var noteArray;
var synth;
var maxGap = 100; // Max jump height
var isPlaying = false;
var currentId = 0;
var animationId;

window.onload = function(){
	gameIsRunning = false;
	canvas = document.getElementById("Game");
	canvas.height = window.innerHeight * 0.75;
	canvas.width = 1000;
	dropZone = document.getElementById('drop_zone');
	dropZone.addEventListener('dragover', handleDragOver, false);
	dropZone.addEventListener('drop', handleFileSelect, false);
	gamePiece = new component(30, 30, "orangered");
	synth = new Tone.Synth().toMaster();
	playNote();
	//startGame();
}

function playNote() {
	var chord = new Tone.PolySynth(3, Tone.AMSynth).toMaster()
	chord.triggerAttack(["C4", "E4", "G3"], .5);
	chord.triggerRelease(["C4", "E4", "G3"], 2.25);
	chord.triggerAttack(["D4", "F#4", "A3"], 2.30);
	chord.triggerRelease(["D4", "F#4", "A3"], 4);
	chord.triggerAttack(["G4", "B3", "D4"], 4.05);
	chord.triggerRelease(["G4", "B3", "D4"], 5.55);
};

function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();
	
	var files = evt.dataTransfer.files;
	if (files.length > 0){
		var file = files[0];
		document.getElementById('Title').innerHTML = '<h3>' + "Now playing - " + file.name.split(".")[0] + '</h3>';
		parseFile(file);
	}
	dropZone.style.display = 'none';
	canvas.style.display = 'inline';
 }

function handleDragOver(evt) {
	evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}


function parseFile(file){
	//read the file
	var reader = new FileReader();
	reader.onload = function(e){
		var partsData = MidiConvert.parse(e.target.result).tracks[1]["notes"];
		parseNotes(partsData);

	};
	reader.readAsBinaryString(file);
}
	
function parseNotes(notes){
	var array = [];
	for (i = 0; i < notes.length; i+=4){
		array.push([notes[i].midi,notes[i].time,notes[i].duration,notes[i].velocity]);
	}
	
	noteArray = array;
	startGame();
}

function startGame() {
	gamePiece.restart();
	currTime = 0;
	prevTime = 0;
	startTime = Date.now();
	score = 0;
	platforms = [];
	platforms.push(new generatePlatform(false, canvas.width/2, 180, 300, 30, 'E'));
	gameArea.keys = [];
	gameArea.start();
}
		
var firstRun = true;
var gameArea = {
	start : function() {
		this.context = canvas.getContext("2d");
	    window.addEventListener('keydown', function (e) {
            gameArea.keys = (gameArea.keys || []);
            gameArea.keys[e.keyCode] = true;
        })
        window.addEventListener('keyup', function (e) {
            gameArea.keys[e.keyCode] = false; 
        })
		if (firstRun) {
			gameArea.run();
			firstRun = false;
		}
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
			var notesArr = ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4'];
			var nt = notesArr[parseInt(Math.random()*7)];
			platforms.push(new generatePlatform(true, gamePiece.x+Math.random()*100+150, Math.random()*50+300, 100, 30, nt));
			prevTime = currTime;
		}

		gamePiece.speedY += (gamePiece.onGround ? -gamePiece.speedY : 0.239);
		gamePiece.speedY = Math.min(gamePiece.speedY, 1.5);
		
		if (gameArea.keys && gameArea.keys[32] && gamePiece.onGround) {gamePiece.speedY = -4; }
		if (gameArea.keys && gameArea.keys[88] && !gamePiece.onGround) {
			while (!gamePiece.onGround && !(gamePiece.y + gamePiece.height > canvas.height)) {
				gamePiece.speedY = 1;
				gamePiece.update(dt);
			}
		}
		gamePiece.color = "orangered";
		if (gameArea.keys && gameArea.keys[37] && gameArea.keys[39]) {
			
		} else if (gameArea.keys && gameArea.keys[37]) {
			movePlatforms(platforms, .9);
			gamePiece.color = "salmon";
		} else if (gameArea.keys && gameArea.keys[39]) {
			movePlatforms(platforms, -.9);
			gamePiece.color = "red";
		}
		
		
		for (i = 0; i < platforms.length; i++) {
			platforms[i].update(dt);
			platforms[i].draw();
		}
		
		gamePiece.update(dt); 
		gamePiece.draw();
	},
	run : function() {
		animationId = requestAnimationFrame(gameArea.run);
		var now = Date.now(), dt = (now - (currTime || now)) * 0.15;
		gameArea.update(dt);
		currTime = now;	
	}
}

function component(width, height, color) {
    this.width = width;
    this.height = height;
    this.speedY = 0;
	this.onGround = true;
    this.x = (canvas.width-this.width)/2;
    this.y = 120; 
	this.color = color;
    this.draw = function() {
        ctx = gameArea.context;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
		ctx.fillStyle = "black";
		ctx.font="20px Georgia";
		ctx.fillText(score, 10, 30);
    }
    this.update = function(dt) {
        this.y += this.speedY * dt; 
		
		this.onGround = false;
		var doClear = true;
		for (i = 0; i < platforms.length; i++) {
			if (isOnGround(gamePiece, platforms[i]) && this.speedY >= 0) {
				this.onGround = true;
				platforms[i].setColor("blue");
				if (platforms[i].givePoint) {
					score += 1;
					if (platforms[i].id != currentId) {
						isPlaying = false;
					}
					if (!isPlaying) {
						synth.triggerAttack(platforms[i].note);
						currentId = platforms[i].id;
					}
					doClear = false;
					isPlaying = true;
				}
			} else {
				platforms[i].setColor("green");
			}
		}
		
		if (doClear) {
			synth.triggerRelease();
			isPlaying = false;
		}
		
		if (this.y + this.height > canvas.height) {
			gameOver();
		}
    } 
	this.restart = function() {
		gamePiece.x = (canvas.width-this.width)/2;
		gamePiece.y = 120;
		gamePiece.speedY = 0;
		gamePiece.onGround = true;
		score = 0;
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
		platforms[i].x += spd;
	}
}

function deletePlatforms(arr) {
	for (i = arr.length - 1; i >= 0; i--) {
		if (platforms[i].x + platforms[i].width < 0) {
			arr.splice(i, 1);
		}
	}
}

function generatePlatform(givePoint, x, y, width, volume, note) {
	this.id = parseInt(Math.random()*12424121);
	this.givePoint = givePoint;
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
	window.cancelAnimationFrame(animationId);
	document.getElementById('content').innerHTML = "<p class='centered'>Game over\nScore = " + score + "<\p>";
	$("#Score").modal('show');

	//gameArea.addEventListener("click", startGame());
}
