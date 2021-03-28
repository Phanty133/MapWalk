import Game, { GameState } from "ts/game/Game";

export default class ActionUI{
	private moveBtn: HTMLButtonElement;
	private restBtn: HTMLButtonElement;
	private game: Game;

	constructor(game: Game){
		this.game = game;

		this.moveBtn = document.getElementById("playerMove") as HTMLButtonElement;
		this.restBtn = document.getElementById("playerRest") as HTMLButtonElement;

		this.bindEvents();
	}

	private bindEvents(){
		this.restBtn.addEventListener("click", () => {
			this.game.localPlayer.rest()
		});

		this.moveBtn.addEventListener("click", () => {
			this.game.map.saveSelection();
		});

		this.game.events.on("GameStateChanged", (newState: GameState) => {
			if((newState !== GameState.PlayerAction && newState !== GameState.PlayerInteracting) || !this.game.localPlayer.hasTurn()) {
				this.disable();
			}
			else{
				this.enable();
			}
		});
	}

	enable(){
		this.moveBtn.disabled = false;
		this.restBtn.disabled = false;
	}

	disable(){
		this.moveBtn.disabled = true;
		this.restBtn.disabled = true;
	}
}