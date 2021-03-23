import Game from "ts/game/Game";

export default class TurnDisplay{
	turnEl: HTMLSpanElement;
	game: Game

	constructor(game: Game){
		this.turnEl = document.getElementById("gameTurn");
		this.game = game;

		if(game.isMultiplayer){
			this.turnEl.parentElement.style.display = "block";
		}
	}

	update(){
		this.turnEl.textContent = this.game.turnMan.activePlayer.info.plyrData.username;
	}
}
