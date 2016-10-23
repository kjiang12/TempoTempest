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
var incJumpLocs = [];
var incJumpVal = [];

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

function restartGame(){
	$("#Score").modal('hide');
	startGame();
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
		var display = MidiConvert.parse(e.target.result).tracks
		
		var partsData;
		try {
			partsData = MidiConvert.parse(e.target.result).tracks[1]["notes"];
		} catch(err) {
			partsData = MidiConvert.parse(e.target.result).tracks[0]["notes"];	
		}
		//window.alert(JSON.stringify(partsData));
			//window.alert(JSON.stringify(partsData.length));
		parseNotes(partsData);
	};
	reader.readAsBinaryString(file);
}
	
function parseNotes(notes){
	var array = [];
	for (i = 0; i < notes.length; i++){
		array.push([notes[i].midi,notes[i].time,notes[i].duration,notes[i].velocity,notes[i].name]);
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
	platforms.push(new generatePlatform(false, canvas.width/2, 180, 300 + noteArray[0][1] * 100, 30, 'E1'));
	generatePlatforms(noteArray);

	gameArea.keys = [];
	gameArea.start();
}
		
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

		gamePiece.speedY += (gamePiece.onGround ? -gamePiece.speedY : 0.239);
		gamePiece.speedY = Math.min(gamePiece.speedY, 2);
		
			if (gameArea.keys && gameArea.keys[32] && gamePiece.onGround) {
			var jumpBoost = false;
			var index = -1;
			for (i = 0; i < incJumpLocs.length; i++) {
				if (gamePiece.onTile == incJumpLocs[i]) {
					jumpBoost = true;
					index = i;
				}
			}
			gamePiece.speedY = jumpBoost ? incJumpVal[index] : -4;
		}
		if (gameArea.keys && gameArea.keys[88] && !gamePiece.onGround) {
			while (!gamePiece.onGround && !(gamePiece.y + gamePiece.height > canvas.height)) {
				gamePiece.speedY = 1;
				gamePiece.update(dt);
			}
		}
		gamePiece.color = "orangered";
		if (gameArea.keys && gameArea.keys[39]) {
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
	this.onTile = -1;
    this.draw = function() {
        ctx = gameArea.context;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.height, 0, 2 * Math.PI, false);
		var grad = ctx.createRadialGradient(this.x, this.y, this.height/4, this.x, this.y, this.height);
		grad.addColorStop(0, "white");
		grad.addColorStop(1, this.color);
        ctx.fillStyle = grad;
		ctx.shadowBlur = 10;
		ctx.shadowColor = this.color;
		ctx.fill();
		//ctx.stroke();
        //ctx.fillRect(this.x, this.y, this.width, this.height);
		//ctx.fillStyle = "black";
		ctx.shadowBlur = 0;
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
				this.onTile = platforms[i].id;
				platforms[i].setColor(true);
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
				platforms[i].setColor(false);
			}
		}
		
		if (doClear) {
			synth.triggerRelease();
			this.onTile = -1;
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
	var rectX = platform.x + platform.width/2;
	var rectY = platform.y + platform.height/2;
	
	var distX = Math.abs(myPiece.x - rectX);
	var distY = Math.abs(myPiece.y - rectY);
	
	if(distX > (platform.width/2 + myPiece.height) || distY > (platform.height/2 + myPiece.height) || myPiece.speedY < 0){
		return false;
	}
	
	if(distX <= platform.width/2 || distY <= platform.height/2){
		myPiece.y = platform.y - myPiece.height;
		return true;
	}
	
	var dx = distX - platform.width/2;
	var dy = distY - platform.height/2;
	return (dx*dx + dy*dy <= myPiece.height * myPiece.height);
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
function generatePlatforms(array) {
//notes[i].midi,notes[i].time,notes[i].duration,notes[i].velocity,notes[i].name
	for(i = 0; i < array.length; i++) {
		var random = parseInt(Math.random()*5);
		
		platforms.push(new generatePlatform(true, canvas.width/2 + 300 + 200 * array[i][1], canvas.height - array[i][0] * 20 + 1000, array[i][2] * 150, array[i][3], array[i][4]));
	}

	platforms.sort(function(a, b) {
		return a.x - b.x;
	});
	checkPlatforms();
}

function checkPlatforms() {
	for (i = 0; i < platforms.length - 1; i++) {
		if (platforms[i].y - platforms[i+1].y > 90) {
			incJumpLocs.push(platforms[i].id);
			incJumpVal.push(-2.5 + (platforms[i].y - platforms[i+1].y) / -50);
		}
	}
}

function generatePlatform(givePoint, x, y, width, volume, note) {
	this.id = parseInt(Math.random()*5000);
	this.givePoint = givePoint;
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = 15;
	this.gradOne = false;
	this.volume = volume;
	this.note = note;
	
	this.update = function(dt){
		this.x -= 1.3 * dt;
	}
	this.draw = function() {
		ctx = gameArea.context;
		
  
		var grd=ctx.createLinearGradient(this.width / 2,this.y,this.width / 2,this.y + 30);
		if (this.gradOne) {
			ctx.shadowBlur = 20;
			ctx.shadowColor = "yellow";
			grd.addColorStop(0,"yellow");
			grd.addColorStop(1,"white");
		} else {
			grd.addColorStop(0, "black");
			grd.addColorStop(1, "black");
		}
		ctx.fillStyle = grd;
        ctx.fillRect(this.x, this.y, this.width, this.height);
		ctx.shadowBlur = 5;
	}
	this.setColor = function(gradOne) {
		this.gradOne = gradOne;
	}
}

function gameOver() {
	window.cancelAnimationFrame(animationId);
	document.getElementById('content').innerHTML = "<p >Game over\nScore = " + score + "<\p>";
	$("#Score").modal('show');
}
