/* global Highscore, io, apiURL */

let highscoreManager = new Highscore();
let waitingTime = 0;

$(document).ready(function() {
	highscoreManager.updateHighscores();

	let socket = io();

	setInterval(() => {
		if(waitingTime === 0) {
			$('#waitingTime').text('');
		}
		else {
			$('#waitingTime').text('(' + (Math.floor((Date.now() - waitingTime) / 1000) + 1) + 's)');
		}
	}, 1000);

	// Websocket initializations
	socket.emit('receiveStats', null);

	socket.on('statsPlayerWaitig', (playersWaiting) => {
		if(playersWaiting > 0) {
			$('#waitingPlayers').text('1');
			waitingTime = playersWaiting
			$('#waitingTime').text('(' + (Math.floor((Date.now() - waitingTime) / 1000) + 1) + 's)');
		}
		else {
			$('#waitingPlayers').text('0');
			$('#waitingTime').text('');
			waitingTime = 0;
		}
	});
			
	socket.on('statsActivePlayers', (activePlayers) => {
		$('#activePlayers').text(activePlayers);
	});
			
	socket.on('statsGamesPlayed', (gamesPlayed) => {
		$('#gamesPlayed').text(gamesPlayed);

		updateAvgScore();
	});

	updateAvgScore();
});

function updateAvgScore() {
	$.ajax({
		method: "GET",
		dataType: "JSON",
		url: apiURL + "/highscore",
		error: function (xhr, ajaxOptions, thrownError) {
			$("#averageScore").text('-');
		}
	}).done((msg) => {
		let scores = msg.highscore.map((elem) => {
			return parseInt(elem.points, 10);
		});
		$("#averageScore").text(Math.floor(scores.reduce((total, current) => {
			return total + current;
		}) / scores.length));
	});
}
