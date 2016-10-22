var myGamePiece;
var canvas;
var dropZone;

window.onload = function(){
	canvas = document.getElementById("Game");
	dropZone = document.getElementById('drop_zone');
	dropZone.addEventListener('dragover', handleDragOver, false);
	dropZone.addEventListener('drop', handleFileSelect, false);
}

function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var file = evt.dataTransfer.files[0]; // FileList object.
	
    document.getElementById('Title').innerHTML = '<h1>' + file.name + '</h1>';
	startGame();
  }

function handleDragOver(evt) {
	evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

  
function startGame() {
	timer = 0;
	myGamePiece = new component(30, 30, "red", 10, 120);
	myGameArea.start();
}

var myGameArea = {
	start : function() {
		canvas.width = 1000;
		canvas.height = 720;
		this.context = canvas.getContext("2d");
		document.body.insertBefore(canvas, document.body.childNodes[0]);
		this.interval = setInterval(updateGameArea, 1);
	    window.addEventListener('keydown', function (e) {
            myGameArea.keys = (myGameArea.keys || []);
            myGameArea.keys[e.keyCode] = true;
        })
        window.addEventListener('keyup', function (e) {
            myGameArea.keys[e.keyCode] = false; 
        })
	},
	clear : function(){
		this.context.clearRect(0, 0, canvas.width, canvas.height);
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
    this.update = function() {
        ctx = myGameArea.context;
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    this.newPos = function() {
        this.x += this.speedX;
        this.y += this.speedY; 
		
		this.onGround = false;
		for (i = 0; i < arr.length; i++) {
			if (isOnGround(myGamePiece, arr[i])) {this.onGround = true; }
		}
    } 
}

var arr = [];
var b = true;
function updateGameArea() {
	if (b) {
		arr.push(new generatePlatform(500, 500, 100));
		b = false;
	}
	
    myGameArea.clear();
    myGamePiece.speedX = 0;
	
	for (i = 0; i < arr.length; i++) {
		arr[i].update();
	}

	if (myGamePiece.onGround) {myGamePiece.speedY = 0; }
	else {myGamePiece.speedY += .0049; }
	if (myGameArea.keys && myGameArea.keys[38] && myGamePiece.onGround) {myGamePiece.speedY = 10; }
    if (myGameArea.keys && myGameArea.keys[37]) {myGamePiece.speedX = -2; }
    if (myGameArea.keys && myGameArea.keys[39]) {myGamePiece.speedX = 2; }
    myGamePiece.newPos(); 
    myGamePiece.update();
}

function isOnGround(myPiece, platform) {
	if (myPiece.x + myPiece.width < platform.x || myPiece.x > platform.x + platform.width) {return false; }
	
	if (myPiece.y + myPiece.height >= platform.y && myPiece.y + myPiece.height <= platform.y + platform.height) {return true; }
	
	return false;
}

function generatePlatform(x, y, width) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = 15;
	this.update = function() {
		this.x--;
		ctx = myGameArea.context;
		ctx.fillStyle = "green";
        ctx.fillRect(this.x, this.y, this.width, this.height);
	}
}