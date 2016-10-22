var myGamePiece;
var canvas;
window.onload = function() {
	canvas = document.getElementById("Game");
	startGame();
};

function startGame() {
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
    } 
}

function updateGameArea() {
    myGameArea.clear();
    myGamePiece.speedX = 0;
    myGamePiece.speedY = myGamePiece.speedY+.0049; 
	if (myGamePiece.y >= canvas.height - myGamePiece.height) {myGamePiece.speedY = 0}
    if (myGameArea.keys && myGameArea.keys[37]) {myGamePiece.speedX = -2; }
    if (myGameArea.keys && myGameArea.keys[39]) {myGamePiece.speedX = 2; }
    myGamePiece.newPos(); 
    myGamePiece.update();
}

function generatePlatform(x, y) {
	
}