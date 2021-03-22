import Game from "ts/game/Game";

export default class GameEndUI{
	private gameEndContainer: HTMLDivElement;
	private timeTaken: HTMLSpanElement;
	private score: HTMLSpanElement;
	private time: HTMLSpanElement;
	private game: Game;

	constructor(game: Game){
		this.game = game;

		this.gameEndContainer = document.getElementById("gameEndContainer") as HTMLDivElement;
		this.timeTaken = document.getElementById("gameEndTimeTaken") as HTMLSpanElement;
		this.score = document.getElementById("gameEndScore") as HTMLSpanElement;
		this.time = document.getElementById("gameEndTime") as HTMLSpanElement;

		document.getElementById("gameEndExit").addEventListener("click", () => { window.location.href = "/"; });
	}

	show(){
		this.timeTaken.textContent = this.game.clock.timeStringSinceStart;
		this.score.textContent = this.game.localPlayer.stats.score.toString();
		this.time.textContent = this.game.clock.timeString;

		this.gameEndContainer.style.display = "block";
	}
}
