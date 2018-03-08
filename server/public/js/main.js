import 'jquery';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/main.css';
import '../css/highscores.css';
import IO from 'socket.io-client';
import {Gamefield} from './gamefield';
import {Highscore} from './highscore';
import {UIManager} from './uiManager';
import {ships} from './ships';

let myShips = new Gamefield("myGameFieldBody");
let otherShips = new Gamefield("otherGameFieldBody");
let highscoreManager = new Highscore();

let shipsReady = false, gameInterrupted = false;
let isPlayerTurn, gameIsRunning;
let myHighscore = 0;

let player1 = "Player1", player2 = "Player2";

// Initializations
$(document).ready(function() {
	// Get player name from local storage
	if (typeof(Storage) !== "undefined") {
		// Code for localStorage
		if(localStorage.playerName != undefined) {
			$('#player1').val(localStorage.playerName);
		}
	}

	// UI initializations
	UIManager.inititializeShips(myShips.id);
	UIManager.inititializeShips(otherShips.id);
	UIManager.shipSetup(ships.availableShips, "myShipsToSetUp")

	let socket = IO();

	$("#playerInputModal").modal("show");

	// Websocket initializations
	socket.on('beginner', (beginner) => {
		$("#otherArea").hide();
		isPlayerTurn = beginner;
		gameIsRunning = true;

		if(beginner) {
			$("#otherGameField").addClass("activeBoard");
			UIManager.printGameLog("\"" + player1 + "\" ist am Zug.");

			$("#turn-otherGameFieldBody").addClass("myTurnBg");
		}
		else {
			UIManager.printGameLog("Auf \"" +  player2 + "\" warten.");

			$("#turn-otherGameFieldBody").addClass("enemyTurnBg");
		}
	});

	socket.on('disconnect', () => {
		UIManager.printGameLog("Server nicht gefunden.");
		gameIsRunning = false;
	});

	socket.on('connection_failed', () => {
		UIManager.printGameLog("Server nicht gefunden.");
	});

	socket.on('reconnect', () => {
		if(gameInterrupted) {
			UIManager.printGameLog("Server wieder verfügbar. Neu laden zum Neustart.");
			gameIsRunning = false;
		}
		else {
			UIManager.printGameLog("Server wieder verfügbar.");
		}
	});

	socket.on('enemy_name', (name) => {
		player2 = name;
		$('#player2').val(player2);
		$('#player2Name').html(player2);
	});

	socket.on('message', (msg) => {
		// Print message
		UIManager.printGameLog(msg);
	});

	socket.on('end', (msg) => {
		// Print message
		UIManager.printGameLog(msg);
	});


	// UI event handlers
	$("#savePlayerBtn").on("click", savePlayer);

	$("#setUpShipsRandomly").on("click", (event) => {
		myShips.setUpShipsRandomly();
		UIManager.showShips(myShips.board, myShips.id);

		$("#sendShips").removeClass("disabled");
		$("#sendShips").text("Bereit");
		shipsReady = true;

	});

	$("#sendShips").on('click', (event) => {
		if(shipsReady){
			socket.emit('name', player1);

			gameInterrupted = true;
			socket.emit('ships', {ships:myShips.shipCoordinatesForServer});
			$("#shipSetup").hide();
			$("#otherGameField").show();

			UIManager.printGameLog("Gegner wird gesucht...");
		}
	});

	$("#otherGameField .boardField").on('click', (event) => {
		//gets id from specific clicked field and extracts coordinates in an array
		let position = event.currentTarget.id.split("-").reverse();
		position.pop();
		position = position.reverse();
		position = position.map((val) => {return parseInt(val);});

		if (isPlayerTurn && gameIsRunning && !UIManager.isMarked(position[0], position[1], "otherGameFieldBody")){
			gameIsRunning = false;

			socket.emit('shot', {coordinates:position});
			myHighscore++;
		}
	});

	// Turn result handlers
	socket.on('miss', (position) => {
		position = position.coordinates;

		UIManager.markField(position[0], position[1], (isPlayerTurn ? "otherGameFieldBody": "myGameFieldBody"));

		isPlayerTurn = !isPlayerTurn;
		$("#otherGameField").toggleClass("activeBoard");

		$("#turn-otherGameFieldBody").toggleClass("myTurnBg");
		$("#turn-otherGameFieldBody").toggleClass("enemyTurnBg");

		UIManager.printGameLog(`"${(isPlayerTurn ?  player2 : player1)}" missed: [${UIManager.alphabet[position[1]]}, ${(position[0] + 1)}]`);
		gameIsRunning = true;
	});

	socket.on('hit', (position) => {
		position = position.coordinates;

		UIManager.setShipField(position[0], position[1], (isPlayerTurn ? "otherGameFieldBody" : "myGameFieldBody"));
		UIManager.markField(position[0], position[1], (isPlayerTurn ? "otherGameFieldBody" : "myGameFieldBody"));

		UIManager.printGameLog(`"${(isPlayerTurn ?  player1 : player2)}" hitted: [${UIManager.alphabet[position[1]]}, ${(position[0] + 1)}]`);
		gameIsRunning = true;
	});

	socket.on('destroyed', (position) => {
		position = position.coordinates;

		UIManager.setShipField(position[0], position[1], (isPlayerTurn ? "otherGameFieldBody" : "myGameFieldBody"));
		UIManager.markField(position[0], position[1], (isPlayerTurn ? "otherGameFieldBody" : "myGameFieldBody"));
		UIManager.sinkShip(position[0], position[1], (isPlayerTurn ? "otherGameFieldBody" : "myGameFieldBody"));

		UIManager.printGameLog(`"${(isPlayerTurn ?  player1 : player2)}" destroyed: [${UIManager.alphabet[position[1]]}, ${(position[0] + 1)}]`);
		gameIsRunning = true;
	});

	socket.on('gameFinished', (winner) => {
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



function savePlayer() {
	let id = '#player1';

	if($(id).val() !== "") {
		player1 = $('#player1').val();
		$('#player1Name').html( player1);

		$('#playerInputModal').modal('hide');
		$('#openPlayerInputModal').prop('disabled', true);

		// Save player name in local storage
		if (typeof(Storage) !== "undefined") {
			// Code for localStorage
			localStorage.playerName = $('#player1').val();
		}
	}
	else {
		let signClass = 'alert-danger';
		$(id).removeClass(signClass);
		if($(id).val() === "") {
			$(id).addClass(signClass);
		}
	}
}
