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
var flagObject;
var musicArr = [];
var prevMusicArr = [];

window.onload = function(){
	gameIsRunning = false;
	canvas = document.getElementById("Game");
	canvas.height = window.innerHeight * 0.70;
	
	canvas.width = 1000;
	dropZone = document.getElementById('drop_zone');
	dropZone.addEventListener('dragover', handleDragOver, false);
	dropZone.addEventListener('drop', handleFileSelect, false);
	gamePiece = new component(20, 20, "yellow");
	//synth = new Tone.Synth().toMaster();
	synth = new Tone.PolySynth(4, Tone.AMSynth).toMaster();
	playNote();
}

function restartGame(){
	$("#Score").modal('hide');
	startGame();
}

function playNote() {
	var chord = new Tone.PolySynth(3, Tone.AMSynth).toMaster();
	chord.triggerAttack(["C4", "E4", "G3"], .5);
	chord.triggerRelease(["C4", "E4", "G3"], 2.25);
	chord.triggerAttack(["D4", "F#4", "A3"], 2.30);
	chord.triggerRelease(["D4", "F#4", "A3"], 4);
	chord.triggerAttack(["G4", "B3", "D4"], 4.05);
	chord.triggerAttack(["G3"], 6);
	chord.triggerRelease(["G3", "G4", "B3", "D4"], 7);
}


function playVictory() {
	var chord = new Tone.PolySynth(3, Tone.AMSynth).toMaster();
	chord.triggerAttack(["C4"], 0.5);
	chord.triggerRelease(["C4"], 0.75)
	chord.triggerAttack(["D4"], 0.75);
	chord.triggerRelease(["D4"], 1)
	chord.triggerAttack(["E4"], 1);
	chord.triggerRelease(["E4"], 1.25)
	chord.triggerAttack(["C4", "E4", "G4"], 1.25);
	chord.triggerRelease(["C4", "E4", "G4"], 2.25);
}

function handleFile(files) {
	if (files.length > 0){
		var file = files[0];
		document.getElementById('Title').innerHTML = '<h4>' + "Now playing - " + file.name.split(".")[0] + '</h4>';
		parseFile(file);
	}
	dropZone.style.display = 'none';
	canvas.style.display = 'inline';
 }
 
function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();
	
	var files = evt.dataTransfer.files;
	if (files.length > 0){
		var file = files[0];
		document.getElementById('Title').innerHTML = '<h4>' + "Now playing - " + file.name.split(".")[0] + '</h4>';
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
	platforms.push(new generatePlatform(false, canvas.width/2, 180, 100, 30, 'E1'));
	generatePlatforms(noteArray);
	platforms[0].width = platforms[1].x - (canvas.width / 2) - 100;
	flagObject = new generateFlag(platforms[platforms.length - 1].x + platforms[platforms.length - 1].width - 128, platforms[platforms.length - 1].y - 150);
	
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
		
			if (gameArea.keys && gameArea.keys[90] && gamePiece.onGround) {
			var jumpBoost = false;
			var index = -1;
			for (i = 0; i < incJumpLocs.length; i++) {
				if (gamePiece.onTile == incJumpLocs[i]) {
					jumpBoost = true;
					index = i;
				}
			}
			gamePiece.speedY = jumpBoost ? incJumpVal[index] : -4;
			gamePiece.speedY = Math.min(gamePiece.speedY, -4);
		}
		if (gameArea.keys && gameArea.keys[77] && !gamePiece.onGround && gamePiece.speedY != 0) {
			while (!gamePiece.onGround && !(gamePiece.y + gamePiece.height > canvas.height)) {
				gamePiece.speedY = 1;
				gamePiece.update(dt);
			}
		}
		gamePiece.color = "yellow";
		if (gameArea.keys && gameArea.keys[39]) {
			movePlatforms(platforms, -.9);
			gamePiece.color = "red";
		}
		
		
		for (i = 0; i < platforms.length; i++) {
			platforms[i].update(dt);
			platforms[i].draw();
		}
		flagObject.update(dt);
		flagObject.draw();
		
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
		grad.addColorStop(0, "#f6ff96");
		grad.addColorStop(1, this.color);
        ctx.fillStyle = grad;
		ctx.shadowBlur = 30;
		ctx.shadowColor = this.color;
		ctx.fill();
		ctx.shadowBlur = 0;
		ctx.font="20px Georgia";
		ctx.fillText(score, 30, 30);
		
    }
    this.update = function(dt) {
        this.y += this.speedY * dt; 
		
		this.onGround = false;
		var doClear = true
		var others = [];
		for (i = 0; i < platforms.length; i++) {
			var currPlat = platforms[i];
			if(this.x < currPlat.x + currPlat.width && this.x > currPlat.x){
				if(!musicArr.includes(currPlat.note)){
					musicArr.push(currPlat.note);
				}
			}
			if (isOnGround(gamePiece, currPlat) && this.speedY >= 0) {
				this.onGround = true;
				this.onTile = currPlat.id;
				currPlat.touched = true;
				currPlat.setColor(true);
				others = getVertical(this.x, this.width);
				for (o = 0; o < others.length; o++) {
					others[o].setColor(true);
					others[o].touched = true;
				}
				
				if (currPlat.givePoint) {
					score += 1;
					if (currPlat.id != currentId) {
						isPlaying = false;
					}
					if (!isPlaying) {
						currentId = currPlat.id;
					}
					doClear = false;
					isPlaying = true;
				}
			} else {
				var doReset = true;
				for (o = 0; o < others.length; o++) {
					if (others[o].id == platforms[i].id) {
						doReset = false;
					}
				}
				if (doReset) {
					currPlat.setColor(false);
				}
			}
		}
		
		musicArr.sort();
		
		if(isPlaying && musicArr.toString() != prevMusicArr.toString()){
			synth.triggerRelease(prevMusicArr);
			synth.triggerAttack(musicArr);
			prevMusicArr = musicArr.slice();
		}
		
		if (gamePiece.x > flagObject.x) {
			win();
		}
		
		if (doClear) {
			for (i = 0; i < platforms.length && platforms[i].x < canvas.width; i++) {
				platforms[i].setColor(false);
			}
			synth.triggerRelease(prevMusicArr);
			this.onTile = -1;
			isPlaying = false;
			prevMusicArr =  [];
			musicArr = [];
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
function generatePlatforms(array) {
//notes[i].midi,notes[i].time,notes[i].duration,notes[i].velocity,notes[i].name
	for(i = 0; i < array.length; i++) {
		var random = parseInt(Math.random()*5);
		var x = canvas.width/2 + 300 + 300 * array[i][1];
		var y = canvas.height - array[i][0] * 20 + 1000;
		if (y < 50) {
			y = 50;
		}
		if (y > canvas.height) {
			y = canvas.height - 50;
		}
		var width = array[i][2] * 230;
		var volume = array[i][3];
		var note = array[i][4];
		platforms.push(new generatePlatform(true, x, y, width, volume, note));
	}

	platforms.sort(function(a, b) {
		return a.x - b.x;
	});
	checkPlatforms();
}

function checkPlatforms() {
	for (i = 0; i < platforms.length - 1; i++) {
		var c = 1;
		while (i+c < platforms.length-1 && platforms[i+c].x == platforms[i].x && platforms[i+c].width == platforms[i].width) {
			c++;
		}
		if (platforms[i].y - platforms[i+c].y > 90) {
			incJumpLocs.push(platforms[i].id);
			incJumpVal.push(-2.5 + (platforms[i].y - platforms[i+c].y) / -50);
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
	this.touched = false;
	
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
		} else if (!this.touched) {
			ctx.shadowBlur = 10;
			ctx.shadowColor = "grey";
			grd.addColorStop(0, "white");
			grd.addColorStop(1, "black");
		} else if (this.touched) {
			ctx.shadowBlur = 20;
			ctx.shadowColor = "lime";
			grd.addColorStop(0, "lime");
			grd.addColorStop(1, "cyan");
		}
		ctx.fillStyle = grd;
        ctx.fillRect(this.x, this.y, this.width, this.height);
		ctx.shadowBlur = 5;
	}
	this.setColor = function(gradOne) {
		this.gradOne = gradOne;
	}
}

function generateFlag(x,y) {
	this.x = x;
	this.y = y;

	
	this.update = function(dt){
		this.x -= 1.3 * dt;
	}
	this.draw = function() {
		ctx = gameArea.context;

		var flag = new Image();
		flag.src = 'images/flag.png';
		if (flag.complete) {
			ctx.drawImage(flag, this.x, this.y);
		} else {
			flag.onload = function(){
				ctx.drawImage(this.flag, this.x, this.y);
			}
		}
		


	}
}

function getVertical(x, width) {
	var counter = 0;
	var ret = [];
	while (counter < platforms.length && platforms[counter].x < canvas.width) {
		if (platforms[counter].x <= x + width/2 && platforms[counter].x + platforms[counter].width >= x + width/2)
			ret.push(platforms[counter]);
		counter++;
	}
	return ret;
}

function win() {
	synth.triggerRelease(prevMusicArr);
	gamePiece.y = -50;
	window.cancelAnimationFrame(animationId);
	document.getElementById('content').innerHTML = "<p >Level Complete!\nScore = " + score + "<\p>";
	$("#Score").modal('show');
	playVictory();
}

function gameOver() {
	window.cancelAnimationFrame(animationId);
	document.getElementById("EndTitle").innerHTML = "Game Over";
	document.getElementById('content').innerHTML = " <p>Score = " + score + "<\p>";
	$("#Score").modal('show');
}