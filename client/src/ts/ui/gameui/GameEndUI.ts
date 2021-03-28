import Game from "ts/game/Game";
import createElement from "ts/lib/createElement";
import Log from "ts/lib/log";

export default class GameEndUI{
	private gameEndContainer: HTMLDivElement;
	private timeTaken: HTMLSpanElement;
	private leaderboard: HTMLDivElement;
	private game: Game;

	constructor(game: Game){
		this.game = game;

		this.gameEndContainer = document.getElementById("gameEndOverlay") as HTMLDivElement;
		this.timeTaken = document.getElementById("gameEndTimeTaken") as HTMLSpanElement;
		this.leaderboard = document.getElementById("gameEndLeaderboard") as HTMLDivElement;

		document.getElementById("gameEndExit").addEventListener("click", () => { window.location.href = "/"; });
		document.getElementById("gamePlayAgain").addEventListener("click", () => {
			window.location.href = `/playagain?mode=${this.game.isMultiplayer ? `mp&id=${this.game.lobby.id}` : "sp"}`;
		});
	}

	private addLeaderboardEntry(user: string, score: number, color: string){
		const entryContainer = createElement("div", { parent: this.leaderboard });
		createElement("span", { parent: entryContainer, textContent: user, style: { color } });
		createElement("span", { parent: entryContainer, textContent: score.toString() });
	}

	show(){
		this.timeTaken.textContent = this.game.clock.timeStringSinceStart;

		if(this.game.isMultiplayer){
			Log.log(this.game.players);
			for(const plyr of this.game.players){
				this.addLeaderboardEntry(plyr.info.plyrData.username, plyr.stats.score, plyr.info.plyrData.color);
			}
		}
		else{
			this.addLeaderboardEntry("Local player", this.game.localPlayer.stats.score, "#FFAA00");
		}

		this.gameEndContainer.style.display = "block";
	}
}
