import Game, { GameState } from "ts/game/Game";
import Log from "ts/lib/log";

export class SkipButton{
	private btnEl: HTMLButtonElement;
	private game: Game;

	constructor(game: Game){
		this.btnEl = document.getElementById("playerSkip") as HTMLButtonElement;
		this.game = game;

		this.game.events.on("GameStateChanged", (state: GameState) => { this.onGameState(state); });
		this.btnEl.addEventListener("click", () => { this.btnClickHandler(); });
	}

	private onGameState(newState: GameState){
		if(newState === GameState.PlayerInteracting && this.game.localPlayer.hasTurn() && this.game.isMultiplayer){
			this.btnEl.style.display = "block";
		}
		else{
			this.btnEl.style.display = "none";
		}
	}

	private btnClickHandler(){
		if(!this.game.localPlayer.hasTurn() && this.game.state !== GameState.PlayerInteracting) return;

		this.game.localPlayer.events.emit("PlayerActionDone");
	}
}