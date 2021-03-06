import Log from "ts/lib/log";
import TurnDisplay from "ts/ui/gameui/TurnDisplay";
import Game, { GameState } from "./Game";
import GameEvent from "./GameEvent";
import { GameEventData } from "./GameEventHandler";
import Player from "./Player";

// Used only in MP
export default class TurnManager {
	activeIndex: number;
	playerOrder: Player[];
	game: Game;
	private turnDisplay: TurnDisplay;

	public get activePlayer() {
		return this.playerOrder[this.activeIndex];
	}

	constructor(game: Game) {
		this.game = game;
		this.activeIndex = 0;
		this.playerOrder = [];

		if (this.game.isMultiplayer) this.turnDisplay = new TurnDisplay(this.game);

		this.bindToEvents();
	}

	private bindToEvents() {
		this.game.eventHandler.on("NextTurn", async (data: GameEventData) => { this.onNextTurn(data); });
	}

	private onNextTurn(data: GameEventData) {
		if (!data.success) return;

		if (++this.activeIndex === this.playerOrder.length) {
			this.activeIndex = 0;
		}

		if(this.activeIndex === 0){
			this.game.clock.addTime(10);
		}

		if (this.game.isMultiplayer) {
			this.turnDisplay.update();
		}

		if (this.activePlayer === this.game.localPlayer) {
			this.game.setGameState(GameState.PlayerAction);
		}

		this.game.checkGameEndCondition();

		this.game.events.emit("NextTurn");
	}

	addPlayer(plyr: Player) {
		plyr.events.on("PlayerPass", () => {
			if (!plyr.hasTurn()) return;

			this.next();
		});

		this.playerOrder.push(plyr);

		if (this.playerOrder.length === 1 && this.game.isMultiplayer) {
			this.turnDisplay.update();
		}
	}

	next() {
		this.game.setGameState(GameState.Loading);

		const nextTurnEvent = new GameEvent("NextTurn");
		this.game.eventHandler.dispatchEvent(nextTurnEvent);
	}

	doesSocketHaveTurn(socketid: string) {
		return this.activePlayer.info.socketID === socketid;
	}

	update() {
		this.turnDisplay?.update();
	}

	setTurn(index: number, order?: string[]){
		if(order){
			this.playerOrder = order.map(id => this.game.playersByID[id]);
		}

		this.activeIndex = index;
		this.update();
	}
}
