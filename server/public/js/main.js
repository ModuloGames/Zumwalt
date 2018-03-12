/* global Gamefield, Highscore, UIManager, ships, io */

let myShips = new Gamefield("myGameFieldBody");
let otherShips = new Gamefield("otherGameFieldBody");
let highscoreManager = new Highscore();

let shipsReady = false, gameInterrupted = false;
let isPlayerTurn, gameIsRunning;
let myHighscore = 0;

let showIntroduction = false, showQuickstartTutorial = false;

let player1 = "Player1", player2 = "Player2";

// Initializations
$(document).ready(function() {
	// Get player name from local storage
	if (typeof(Storage) !== "undefined") {
		// Code for localStorage
		if(localStorage.playerName != undefined) {
			$('#player1').val(localStorage.playerName);
		}

		if(localStorage.showManual === undefined
		|| localStorage.showManual === true) {
			showIntroduction = true;
		}
		if(localStorage.showTutorial === undefined
			|| localStorage.showTutorial === true) {
			showQuickstartTutorial = true;
		}
	}
	else {
		showIntroduction = true;
		showQuickstartTutorial = true;
	}

	// UI initializations
	UIManager.inititializeShips(myShips.id);
	UIManager.inititializeShips(otherShips.id);
	UIManager.shipSetup(ships.availableShips, "myShipsToSetUp")

	let socket = io();

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

		
		$('#messageBox').popover("hide");
		$('#otherGameFieldBody').popover("show");
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
		$('#player2Name').text(player2);
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
	$("#setUpShipsRandomly").on("click", (event) => {
		myShips.setUpShipsRandomly();
		UIManager.showShips(myShips.board, myShips.id);

		$("#sendShips").removeClass("disabled");
		$("#sendShips").text("Bereit");
		shipsReady = true;

		$('#setUpShipsRandomly').popover("hide");
		$('#sendShips').popover("show");

	});

	$("#sendShips").on('click', (event) => {
		if(shipsReady){
			socket.emit('name', player1);

			gameInterrupted = true;
			socket.emit('ships', {ships:myShips.shipCoordinatesForServer});
			$("#shipSetup").hide();
			$("#otherGameField").show();

			UIManager.printGameLog("Gegner wird gesucht...");
			UIManager.showWaiting();
			
			$('#sendShips').popover("hide");
			$('#messageBox').popover("show");
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

		$('#otherGameFieldBody').popover("hide");
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

		UIManager.printGameLog(`"${(isPlayerTurn ?  player1 : player2)}" hit: [${UIManager.alphabet[position[1]]}, ${(position[0] + 1)}]`);
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

		$('#otherGameFieldBody').popover("hide");

		if (winner){
			UIManager.printGameLog("Glückwunsch, du hast gesiegt!");
			$("#otherGameField").removeClass("activeBoard");
			highscoreManager.setHighscore(myHighscore);
			highscoreManager.updateHighscores();

			$("#scoreLabel").text(highscoreManager.maxPoints - myHighscore);
			$("#winnerModal").modal("show");
		}
		else{
			UIManager.printGameLog("Schade, du hast leider verloren!");

			$("#looserModal").modal("show");
		}
	});

	highscoreManager.updateHighscores();
});

function showManual() {
	let alertArea = $('#alertArea');

	let alertBox = $('<div/>');
	alertBox.addClass('alert');
	alertBox.addClass('alert-info');
	alertBox.addClass('alert-dismissable');
	alertBox.addClass('fade');
	alertBox.addClass('in');
	alertBox.css('margin-top', '5%');

	let closeBtn = $('<a/>');
	closeBtn.addClass('close');
	closeBtn.attr('data-dismiss', 'alert');
	closeBtn.attr('aria-label', 'close');
	closeBtn.html('&times;');
	closeBtn.css('opacity', '1');
	closeBtn.css('font-size', '20pt');
	closeBtn.on('click', (event) => {
		if (typeof(Storage) !== "undefined") {
			// Code for localStorage
			localStorage.showManual = false;
		}
	});

	let text = $('<p/>');
	text.append($('<strong>Schiffe versenken</strong>'));
	text.append($('<br/>'));

	let manualText = "Schiffe versenken ist ein strategisches Spiel für zwei Spieler. ";
	manualText += "Zuerst platzieren beide Spieler auf einem 10x10 Felder großen Spielfeld ihre 10 Schiffe. ";
	manualText += "Dabei gelten folgende Regeln:<ul>";
	manualText += "<li>Die Schiffe dürfen nicht aneinander stoßen.</li>";
	manualText += "<li>Die Schiffe dürfen nicht diagonal aufgestellt werden.</li>";
	manualText += "<li>Die Schiffe dürfen auch am Rand liegen.</li>";
	manualText += "</ul>Danach schießen die beiden Spieler abwechselnd auf das Feld des anderen, ";
	manualText += "indem sie die Koordinaten nennen (z.B. B4). Ein Schuss wird abgegeben, indem man auf ein Feld ";
	manualText += "des gegnerischen Spielfeldes clickt. Welcher Spieler anfängt wird zufällig bestimmt. ";
	manualText += "Nach dem Spielstart wird in der oberen Ecke des gegnerischen Spielfeldes angezeigt, ob ";
	manualText += "man am Zug ist (grün) oder nicht (rot). ";
	manualText += "Wenn ein Spieler daneben schießt ist der andere am Zug, trifft er ein Schiff des Gegners, ";
	manualText += "darf er noch einmal schießen. Wenn ein Schiff komplett getroffen ist, wird es versenkt, ";
	manualText += "was durch einen roten Hintergrund gekennzeichnet wird. Das Ziel ist es, alle ";
	manualText += "gegnerischen Schiffe zu versenken, dann ist das Spiel beendet.<br/>";
	manualText += "Sollte ein neuer Highscore erzielt worden sein, so kann man das in der Highscore-Liste nachlesen.";
	text.append(manualText);

	alertBox.append(closeBtn);
	alertBox.append(text);

	alertArea.append(alertBox);
}

function showTutorial() {
	let randomShipsPopoverText = "Durch mehrfaches klicken kannst du die Schiffe anders anordnen.";
	let sendShipsPopoverText = "Wenn die Schiffe zu deiner Zufriedenheit verteilt sind, klicke \"Bereit\".";
	let messageBoxPopoverText = "Ein Mitspieler wird gesucht, das kann einen Moment dauern. Sollte kein Spieler gefunden werden, versuche es später erneut oder lade einen Freund ein, mitzuspielen.";
	let otherFieldPopoverText = "Sobald das Feld in der Ecke grün wird, wähle ein Feld des Gegners, das du beschießen willst.";
	let disableTutorialBtn = "<button class='btn btn-warning' style='font-size: 10pt;' onclick='disableTutorial();'>Überspringen</button>";

	

	let randomShips = $('#setUpShipsRandomly');
	randomShips.popover({
		content: "<span style='color: black;'>" + randomShipsPopoverText + "<br/>" + disableTutorialBtn + "</span>",
		html: true,
		placement: "bottom",
		trigger: "manual"
	});
	
	$('#sendShips').popover({
		content: "<span style='color: black;'>" + sendShipsPopoverText + "</span>",
		html: true,
		placement: "bottom",
		trigger: "manual"
	});

	$('#messageBox').popover({
		content: "<span style='color: black;'>" + messageBoxPopoverText + "</span>",
		html: true,
		placement: "top",
		trigger: "manual"
	});

	$('#otherGameFieldBody').popover({
		content: "<span style='color: black;'>" + otherFieldPopoverText + "</span>",
		html: true,
		placement: "top",
		trigger: "manual"
	});

	randomShips.popover("show");
}

function disableTutorial() {
	// Disable tutorial in local storage
	if (typeof(Storage) !== "undefined") {
		// Code for localStorage
		localStorage.showTutorial = false;
		$('#setUpShipsRandomly').popover("destroy");
		$('#sendShips').popover("destroy");
		$('#messageBox').popover("destroy");
		$('#otherGameFieldBody').popover("destroy");
	}
}




function savePlayer() {
	let id = '#player1';

	if($(id).val() !== "") {
		player1 = $('#player1').val();
		$('#player1Name').text( player1);

		$('#playerInputModal').modal('hide');
		$('#openPlayerInputModal').prop('disabled', true);

		// Save player name in local storage
		if (typeof(Storage) !== "undefined") {
			// Code for localStorage
			localStorage.playerName = $('#player1').val();
		}

		if (showIntroduction) {
			showManual();
		}
		if(showQuickstartTutorial) {
			showTutorial();
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