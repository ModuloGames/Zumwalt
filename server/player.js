module.exports = class Player {

	constructor(socket) {
		this.playerSocket = socket;
		this.playerShips;
		this.playerActive = false;
		this.playerShots = [];
		this.playerEnemy;
		this.playerName;
		this.playerWaiting = false;
	}

	
	emit(name, data) {
		this.socket.emit(name, data);
	}

	beginGame(beginner) {
		this.playerActive = beginner;
		this.socket.emit('beginner', beginner);
	}

	addShot(shot) {
		this.shots.push(shot);
	}


	get socket() {
		return this.playerSocket;
	}

	get ships() {
		return this.playerShips;
	}

	get shots() {
		return this.playerShots;
	}

	get enemy() {
		return this.playerEnemy;
	}

	get name() {
		return this.playerName;
	}

	get active() {
		return this.playerActive;
	}

	get waiting() {
		return this.playerWaiting;
	}


	set name(value) {
		this.playerName = value;
	}

	set enemy(value) {
		this.playerWaiting = false;
		this.playerEnemy = value;
	}

	set active(value) {
		this.playerActive = value;
	}

	/*set shots(value) {
		this.playerShots = value;
	}*/

	set ships(value) {
		this.playerShips = value;
	}

	wait() {
		this.playerWaiting = true;
	}

	stopWaiting() {
		this.playerWaiting = false;
	}

	toggleActive() {
		this.playerActive = !this.playerActive;
	}
}