import Game, { GameMode } from "ts/game/Game";
import createElement from "ts/lib/createElement";
import Log from "ts/lib/log";

export default class GameEndUI{
	static endMessage: Record<number, string> = {
		0: "You ran out of time!",
		1: "All objects visited!",
		2: "All objects visited!"
	};

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
			for(const plyr of this.game.players){
				this.addLeaderboardEntry(plyr.info.plyrData.username, plyr.stats.score, plyr.info.plyrData.color);
			}
		}
		else{
			this.addLeaderboardEntry("Local player", this.game.localPlayer.stats.score, "#FFAA00");
		}

		document.getElementById("gameEndMessage").textContent = GameEndUI.endMessage[this.game.settings.gamemode];

		this.gameEndContainer.style.display = "block";
	}
}
