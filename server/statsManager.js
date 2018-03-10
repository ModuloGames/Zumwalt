module.exports = class StatsManager {
	constructor() {
		this._activePlayers = 0;
		this._gamesPlayed = 0;
		this._waitingPlayer = false;
		this._waitingSince = 0;

		this._observers = [];
	}

	
	set playerWaiting(bool) {
		this._waitingPlayer = bool;
		if(this._waitingPlayer) {
			this._waitingSince = Date.now();
		}
		else {
			this._waitingSince = 0;
		}
		
		this.updateObservers('statsPlayerWaitig', this._waitingSince);
	}
	
	addPlayer() {
		this._activePlayers++;

		this.updateObservers('statsActivePlayers', this._activePlayers);
	}

	removePlayer() {
		this._activePlayers--;

		this.updateObservers('statsActivePlayers', this._activePlayers);
	}

	addPlayedGame() {
		this._gamesPlayed++;

		this.updateObservers('statsGamesPlayed', this._gamesPlayed);
	}


	addObserver(observer) {
		this._observers.push(observer);

		observer.emit('statsPlayerWaitig', this._waitingSince);
		observer.emit('statsActivePlayers', this._activePlayers);
		observer.emit('statsGamesPlayed', this._gamesPlayed);

		return this._observers.length - 1;
	}

	removeObserver(nr) {
		this._observers.splice(nr, 1);
	}

	updateObservers(name, msg) {
		this._observers.forEach(observer => {
			observer.emit(name, msg);
		});
	}
}