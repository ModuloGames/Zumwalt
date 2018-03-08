const assert = require('assert');
const Player = require('../server/player.js');

describe('Player', function() {
	describe('constructor', function() {
		it('should create a player', function(done) {
			try {
				let player = new Player("socket");
			} catch (error) {
				done(error);
			}
			done()
		});
	});

	describe('getter/setter', function() {
		it('should set and get the socket', function() {
			let player = new Player("socket");

			assert.equal(player.socket, "socket");
			assert.equal(player.socket, "socket");
		});

		it('should set and get the name', function() {
			let player = new Player("socket");

			player.name = "player";
			assert.equal(player.name, "player");

			player.name = "player2";
			assert.equal(player.name, "player2");
		});

		it('should set and get the ships', function() {
			let player = new Player("socket");

			player.ships = "ships";
			assert.equal(player.ships, "ships");

			player.ships = "ships2";
			assert.equal(player.ships, "ships2");
		});

		it('should set and get the enemy', function() {
			let player = new Player("socket");

			player.enemy = "enemy";
			assert.equal(player.enemy, "enemy");

			player.enemy = "enemy2";
			assert.equal(player.enemy, "enemy2");
		});

		it('should set and get the active state', function() {
			let player = new Player("socket");

			assert.equal(player.active, false);

			player.active = true;
			assert.equal(player.active, true);

			player.active = false;
			assert.equal(player.active, false);
		});

		it('should toggle the active state', function() {
			let player = new Player("socket");

			assert.equal(player.active, false);

			player.toggleActive();
			assert.equal(player.active, true);

			player.toggleActive();
			assert.equal(player.active, false);
		});

		it('should not set the shots', function() {
			let player = new Player("socket");

			player.shots = "shots";

			assert.equal(arrayCompare(player.shots, []), true);
		});

		it('should get the shots', function() {
			let player = new Player("socket");

			assert.equal(arrayCompare(player.shots, []), true);

			player.addShot([1, 1])
			assert.equal(arrayCompare(player.shots, [[1, 1]]), true);

			player.addShot([2, 3])
			assert.equal(arrayCompare(player.shots, [[1, 1], [2, 3]]), true);
		});

		it('should set the beginner of the game', function() {
			let player = new Player({emit:function() {}});
			player.beginGame(true);
			assert.equal(player.active, true);

			player = new Player({emit:function() {}});
			player.beginGame(false);
			assert.equal(player.active, false);
		});
	});

	it('should emit messages', function(done) {
		let player = new Player({
			emit: function(name, data) {
				assert.equal(name, 'name');
				assert.equal(data, 'data');
				done()
			}
		});

		player.emit('name', 'data');
	})
});

function arrayCompare(a1, a2) {
	for(let i = 0; i < a1.length; i++) {
		if(a1[i] instanceof Array
			&& !arrayCompare(a1[i], a2[i])) {
			return false;
		}
		else {
			return a1[i] == a2[1];
		}
	}

	return true;
}