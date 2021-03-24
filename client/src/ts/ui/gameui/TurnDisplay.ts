import Game, { GameState } from "ts/game/Game";

export default class TurnDisplay{
	static infoTemplates: Record<string, string> = {
		localTurn: "Your turn",
		interactChoice: "Interact with an object or go to the next turn",
		otherTurn: "$P's turn",
		otherInteracting: "$P is answering a question",
		loading: "Loading...",
		sync: "Syncing game..."
	};

	turnEl: HTMLSpanElement;
	game: Game

	constructor(game: Game){
		this.turnEl = document.getElementById("gameTurnInfo");
		this.game = game;

		if(game.isMultiplayer){
			this.turnEl.style.display = "block";
		}
	}

	update(){
		switch(this.game.state){
			case GameState.PlayerAction:
				if(this.game.turnMan.activePlayer === this.game.localPlayer){
					this.setTurnElMessage("localTurn");
				}
				else{
					this.setTurnElMessage("otherTurn");
				}

				break;
			case GameState.PlayerInteracting:
				if(this.game.turnMan.activePlayer === this.game.localPlayer){
					this.setTurnElMessage("interactChoice");
				}
				else{
					this.setTurnElMessage("otherInteracting");
				}

				break;
			case GameState.Loading:
				this.setTurnElMessage("loading");

				break;
		}
	}

	private setTurnElMessage(templateID: string){
		const msg = TurnDisplay.infoTemplates[templateID].replace(/\$P/g, this.game.turnMan.activePlayer.info.plyrData.username);
		this.turnEl.textContent = msg;
	}
}
