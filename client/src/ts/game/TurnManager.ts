import Log from "ts/lib/log";
import TurnDisplay from "ts/ui/gameui/TurnDisplay";
import Game from "./Game";
import GameEvent from "./GameEvent";
import { GameEventData } from "./GameEventHandler";
import Player from "./Player";

// Used only in MP
export default class TurnManager{
	activeIndex: number;
	playerOrder: Player[];
	game: Game;
	private turnDisplay: TurnDisplay;

	public get activePlayer(){
		return this.playerOrder[this.activeIndex];
	}

	constructor(game: Game){
		this.game = game;
		this.activeIndex = 0;
		this.playerOrder = [];

		if(this.game.isMultiplayer) this.turnDisplay = new TurnDisplay(this.game);

		this.bindToEvents();
	}

	private bindToEvents(){
		this.game.eventHandler.on("NextTurn", (data: GameEventData) => { this.onNextTurn(data); });

		if(this.game.isMultiplayer){
			this.game.p2pEventHandler.eventVerifiers.NextTurn = async () => {
				return true;
			}
		}
	}

	private onNextTurn(data: GameEventData){
		if(!data.success) return;
		Log.log(this);

		if(++this.activeIndex === this.playerOrder.length){
			this.activeIndex = 0;
		}

		if(this.game.isMultiplayer) this.turnDisplay.update();
	}

	addPlayer(plyr: Player){
		plyr.events.on("ActionDone", () => {
			if(!plyr.hasTurn()) return;

			this.next();
		});

		this.playerOrder.push(plyr);

		if(this.playerOrder.length === 1 && this.game.isMultiplayer){
			this.turnDisplay.update();
		}
	}

	next(){
		const nextTurnEvent = new GameEvent("NextTurn");
		this.game.eventHandler.dispatchEvent(nextTurnEvent);
	}
}
