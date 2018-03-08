/* global $, Gamefield, Highscore, UIManager, ships, io */

let myShips = new Gamefield("myGameFieldBody");
let otherShips = new Gamefield("otherGameFieldBody");
let highscoreManager = new Highscore();

let shipsReady = false, gameInterrupted = false;
let isPlayerTurn, gameIsRunning;
let myHighscore = 0;

let player1 = "Player1", player2 = "Player2";

// Initializations
$(document).ready(function() {
	let socket;

	// Turn result handlers
	socket.on('miss', (position)=> {
		position = position.coordinates;
		if (isPlayerTurn){
			//mark position with white dot on enemy board
			UIManager.markField(position[0], position[1], "otherGameFieldBody");
			isPlayerTurn = false;
			$("#otherGameField").removeClass("activeBoard");

			$("#turn-otherGameFieldBody").removeClass("myTurnBg");
			$("#turn-otherGameFieldBody").addClass("enemyTurnBg");
		}
		else{
			//mark position with white dot on own board
			UIManager.markField(position[0], position[1], "myGameFieldBody");
			isPlayerTurn = true;
			$("#otherGameField").addClass("activeBoard");

			$("#turn-otherGameFieldBody").removeClass("enemyTurnBg");
			$("#turn-otherGameFieldBody").addClass("myTurnBg");
		}

		UIManager.printGameLog((isPlayerTurn ?  player2 : player1) + " missed: [" + UIManager.alphabet[position[1]] + ", " + (position[0] + 1) + "]");
		gameIsRunning = true;
	});

	socket.on('hit', (position)=> {
		position = position.coordinates;
		if (isPlayerTurn){
			//mark position with red dot on enemy board
			UIManager.setShipField(position[0], position[1], "otherGameFieldBody");
			UIManager.markField(position[0], position[1], "otherGameFieldBody");
		}
		else{
			//mark position with red dot on own board
			UIManager.markField(position[0], position[1], "myGameFieldBody");
		}

		UIManager.printGameLog((isPlayerTurn ?  player1 : player2) + " hitted: [" + UIManager.alphabet[position[1]] + ", " + (position[0] + 1) + "]");
		gameIsRunning = true;
	});

	socket.on('destroyed', (position)=> {
		position = position.coordinates;
		if (isPlayerTurn){
			//mark ship with dark red dots on enemy board
			UIManager.setShipField(position[0], position[1], "otherGameFieldBody");
			UIManager.markField(position[0], position[1], "otherGameFieldBody");
			UIManager.sinkShip(position[0], position[1], "otherGameFieldBody");
		}
		else{
			//mark ship with dark red dots on own board
			UIManager.markField(position[0], position[1], "myGameFieldBody");
			UIManager.sinkShip(position[0], position[1], "myGameFieldBody");
		}

		UIManager.printGameLog((isPlayerTurn ?  player1 : player2) + " destroyed: [" + UIManager.alphabet[position[1]] + ", " + (position[0] + 1) + "]");
		gameIsRunning = true;
	});

	socket.on('gameFinished', (winner)=>{
		gameIsRunning = false;
		if (winner){
			UIManager.printGameLog("Glückwunsch, du hast gesiegt!");
			$("#otherGameField").removeClass("activeBoard");
			highscoreManager.setHighscore(myHighscore);
			highscoreManager.updateHighscores();

			$("#scoreLabel").text(myHighscore);
			$("#winnerModal").modal("show");
		}
		else{
			UIManager.printGameLog("Schade, du hast leider verloren!");

			$("#looserModal").modal("show");
		}
	});

	highscoreManager.updateHighscores();
});


