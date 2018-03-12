/* global UIManager, apiURL */

class Highscore {
	constructor() {
		this._maxPoints = 130;
	}

	get maxPoints() {
		return this._maxPoints;
	}

	get shownHighscores() {
		return 5;
	}

	setHighscore(myHighscore){
		$.ajax({
			type: "POST",
			data: JSON.stringify({
				"name": $('#player1').val(),
				"points": myHighscore
			}),
			contentType: "application/json",
			dataType: "JSON",
			url: apiURL + "/highscore",
			success: UIManager.printGameLog("Dein Highscore mit " + myHighscore + " wurde erfolgreich gespeichert!")
		});
	}
	
	updateHighscores() {
		let self = this;
		$.ajax({
			method: "GET",
			dataType: "JSON",
			url: apiURL + "/highscore",
			error: function (xhr, ajaxOptions, thrownError) {
				let container = $("#highscores");
				container.html($("<span>Einträge konnten nicht geladen werden.</span><hr/>"));

				let btn = $("<button></button>");
				btn.text("Retry");
				btn.addClass("btn");
				btn.addClass("retryBtn");
				btn.addClass("pull-right");
				btn.on('click', self.updateHighscores.bind(self));

				container.append(btn);
			}
		}).done((msg) => {
			this.showHighscores(this.getBestHighscores(msg.highscore, this.shownHighscores));
		});
	}
	
	getBestHighscores(highscores, nr) {
		highscores.sort(function(a, b){return a.points - b.points});
	
		let best = [];
		let last;
	
		for(let i = 0; i < highscores.length && i < nr; i++) {
			best.push(highscores[i]);
			last = highscores[i];
		}
	
		for(let i = nr; i < highscores.length; i++) {
			if(highscores[i].points == last.points) {
				best.push(highscores[i]);
			}
		}
	
		return best;
	}
	
	showHighscores(highscores) {
		let container = $("#highscores");
		container.html("");

		if(highscores.length == 0) {
			container.append($("<span>Noch keine Einträge.</span><hr/>"));
		}
	
		for(let i = 0; i < highscores.length; i++) {
			let row = $('<span/>', {class: 'highscores'});
			let name = $('<span/>', {class: "col-xs-8"});
			name.text(highscores[i].name);
			let score = $('<span/>', {class: "col-xs-4"});
			score.text((this._maxPoints - highscores[i].points) + " Pt.");
			let brhr = $('<br/><hr/>');
			
			row.append(name);
			row.append(score);
			row.append(brhr);
			container.append(row);
		}
	}
	
}