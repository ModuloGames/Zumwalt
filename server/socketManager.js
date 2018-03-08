/* eslint no-console: "off" */

const Player = require("./player");

let waitingPlayer;

// Initialize socket connections
function newConnection(socket) {
	console.log('A player connected.');

	let player = new Player(socket);

	socket.on('name', (name) => {
		player.name = name;
		console.log(`Player ${name} joined.`);
	});

	socket.on('ships', (shipData) => {
		try {
			handleShipData(player, shipData);
		} catch (error) {
			player.emit('message', error.msg);
		}
	});

	socket.on('shot', (turn) => {
		try {
			handleShotData(player, turn);
		} catch (error) {
			player.emit('message', error.msg);
		}
	});

	socket.on('disconnect', () => {
		try {
			handleDisconnect(player);
		} catch (error) {
			player.emit('message', error.msg);
		}
	});
}

function handleShipData(player, shipData) {
	// Check shipData's format
	if( (shipData === undefined)
	|| (!shipData.hasOwnProperty("ships"))
	|| (!(shipData.ships instanceof Array))
	|| (!shipData.ships.length === 10)
	|| !isBoardValid(shipData.ships)) {
		throw { msg: 'Invalid game board.' };
	}

	// Create new player
	player.ships = shipData.ships;

	if(waitingPlayer !== undefined) {
		// Pair players
		let enemy = waitingPlayer;
		waitingPlayer = undefined;
		enemy.enemy = player;
		player.enemy = enemy;

		// Exchange names
		player.emit('enemy_name', enemy.name);
		enemy.emit('enemy_name', player.name);

		// Start game
		let rand = (Math.floor(Math.random() * 2)) ? true : false; // Choose random start player
		player.beginGame(rand);
		enemy.beginGame(!rand);

		console.log("A game started.");
	}
	else {
		waitingPlayer = player;
		player.wait();
		console.log("A player is ready.");
	}
}

function handleShotData(player, turn) {
	// checks if current player is at the turn
	// checks if the turn fits the format
	if(player.shots === undefined
	|| !player.active
	|| (turn === undefined)
	|| (!turn.hasOwnProperty('coordinates'))
	|| (!(turn.coordinates instanceof Array))
	|| (!turn.coordinates.length === 2)
	|| (turn.coordinates[0] < 0) || (turn.coordinates[0] >= 10)
	|| (turn.coordinates[1] < 0) || (turn.coordinates[1] >= 10)
	|| (player.shots.includes(turn.coordinates))) {
		throw { msg: "Invalid game turn." };
	}
	
	let turnData = turn.coordinates;
	player.addShot(turnData);
	
	let enemy = player.enemy;

	const MISS = 0, HIT = 1, SANK = 2;
	const resultNames = ["miss", "hit", "destroyed"];
	
	let result = MISS;
	for(let j = 0; j < enemy.ships.length; j++) {
		let ship = enemy.ships[j];
	
		for(let k = 0; k < ship.length; k++) {
			let coord = ship[k];
			if(coord[0] === turnData[0] && coord[1] === turnData[1]) {
				// Remve coordinate
				enemy.ships[j] = removeIndex(ship, k);
				result = HIT;
			}
		}
	
		if(enemy.ships[j].length === 0) {
			// Remove sunken ship
			enemy.ships = removeIndex(player.enemy.ships, j);
			result = SANK;
		}
	}
	
	player.emit(resultNames[result], turn);
	enemy.emit(resultNames[result], turn);
	
	if(result === MISS) {
		player.toggleActive();
		enemy.toggleActive();
	}
	
	if(enemy.ships.length == 0) {
		player.emit('gameFinished', true);
		enemy.emit('gameFinished', false);
	
		player.active = false;
		enemy.active = false;
	
		console.log("A game ended.");
	}
}

function handleDisconnect(player) {
	if(player.enemy != undefined) {
		player.enemy.active = false;
		player.enemy.emit('end', 'Enemy disconnected.');

		console.log('A game was aborted by one player.')
	}

	player.active = false;

	if(player.waiting) {
		waitingPlayer = undefined;
		player.stopWaiting();
	}

	console.log('A player disconnected.');
}

function isBoardValid(ships) {
	if(!(ships instanceof Array)) {
		return false;
	}

	// Check if ship array format matches target
	for(let shipNr = 0; shipNr < ships.length; shipNr++) {
		let ship = ships[shipNr];
		if(!(ship instanceof Array)) {
			return false;
		}

		for(let shipFieldNr = 0; shipFieldNr < ship.length; shipFieldNr++) {
			let shipField = ship[shipFieldNr];

			if((!(shipField instanceof Array))
			|| (!shipField.length === 2)
			|| (shipField[0] < 0) || (shipField[0] >= 10)
			|| (shipField[1] < 0) || (shipField[1] >= 10)) {
				return false;
			}
		}
	}

	// Check if ships are placed valid on the board
	// Initialize empty game board
	let testBoard = [];
	for(let i = 0; i < 100; i++) {
		testBoard[i] = 0;
	}

	// Place ships on board
	let remainingShips = ships.length;
	for(let shipNr = 0; shipNr < ships.length; shipNr++) {
		let ship = ships[shipNr];
		for(let shipFieldNr = 0; shipFieldNr < ship.length; shipFieldNr++) {
			let shipField = ship[shipFieldNr];

			let pos = shipField[0] * 10 + shipField[1];

			if( (testBoard[pos] >= remainingShips) // Check current field
			|| ((pos % 10) !== 0 && testBoard[pos - 1] > remainingShips) // Check left
			|| ((pos % 10) !== 9 && testBoard[pos + 1] > remainingShips) // Chek right
			|| ((pos - 10) >= 0 && testBoard[pos - 10] > remainingShips) // Check top
			|| ((pos + 10) < 100 && testBoard[pos + 10] > remainingShips) // Check bottom
			|| ((pos + 9) % 10 !== 9 && (pos - 11) >= 0 && testBoard[pos - 11] > remainingShips) // Check top left
			|| ((pos + 9) % 10 !== 9 && (pos + 9) < 100 && testBoard[pos + 9] > remainingShips) // Check bottom left
			|| ((pos + 11) % 10 !== 0 && (pos - 9) >= 0 && testBoard[pos - 9] > remainingShips) // Check top right
			|| ((pos + 11) % 10 !== 0 && (pos + 11) < 100 && testBoard[pos + 11] > remainingShips) // Check bottom left
			) {
				return false;
			}

			testBoard[pos] = remainingShips;
		}

		remainingShips--;
	}

	return true;
}

function removeIndex(array, index) {
	let result = [];
	for(let i = 0; i < array.length; i++) {
		if(i != index)
			result.push(array[i]);
	}
	return result;
}

module.exports = newConnection;