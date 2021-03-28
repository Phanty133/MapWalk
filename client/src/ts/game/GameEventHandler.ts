import Log from "ts/lib/log";
import { genHexString } from "ts/lib/util";
import Game from "./Game";
import GameEvent from "./GameEvent";
import P2PGameEventHandler from "./P2PGameEventHandler";

type GameEventCallback = (eventData: GameEventData) => Promise<void>;

export interface GameEventData{
	args?: any[],
	event: GameEvent,
	success: boolean,
	foreign: boolean,
	origin: string // Origin socket ID
}

export default class GameEventHandler{
	p2pHandler: P2PGameEventHandler;
	private eventCallbacks: Record<string, GameEventCallback[]> = {};
	private callbackIds: Record<string, GameEventCallback> = {};
	private game: Game;

	constructor(game: Game){
		this.game = game;

		if(this.game.isMultiplayer){
			this.p2pHandler = new P2PGameEventHandler(this.game);
			this.game.p2pEventHandler = this.p2pHandler;

			this.p2pHandler.onEventAccepted = (e: GameEvent) => {
				return this.fireEventCallbacks(e.type, { event: e, success: true, foreign: false, origin: this.game.socket.id });
			};

			this.p2pHandler.onEventEffect = (e: GameEvent, origin: string) => {
				return this.fireEventCallbacks(e.type, { event: e, success: true, foreign: true, origin });
			};

			this.p2pHandler.onEventDeclined = (e: GameEvent) => {
				return this.fireEventCallbacks(e.type, { event: e, success: false, foreign: false, origin: this.game.socket.id });
			}
		}
	}

	dispatchEvent(event: GameEvent){
		if(this.game.isMultiplayer){
			this.p2pHandler.dispatchEvent(event);
		}
		else{
			const eventData: GameEventData = {
				event,
				success: true,
				foreign: false,
				origin: this.game.socket.id
			};

			this.fireEventCallbacks(event.type, eventData);
		}
	}

	private async fireEventCallbacks(event: string, cbData?: GameEventData): Promise<void>{
		const promiseArr = [];

		for(const cb of this.eventCallbacks[event]){
			promiseArr.push(cb(cbData));
		}

		await Promise.all(promiseArr);
	}

	on(event: string, cb: GameEventCallback): string{
		const cbArr = this.eventCallbacks[event];

		if(cbArr !== undefined){
			cbArr.push(cb);
		}
		else{
			this.eventCallbacks[event] = [ cb ];
		}

		const cbID = genHexString(8);
		this.callbackIds[cbID] = cb;

		return cbID;
	}

	removeListener(event: string, callbackID: string): boolean{
		if(this.callbackIds[callbackID]){
			const cb = this.callbackIds[callbackID];

			this.eventCallbacks[event].splice(this.eventCallbacks[event].findIndex(f => f === cb), 1);
			delete this.callbackIds[callbackID];
		}
		else{
			return false;
		}
	}
}