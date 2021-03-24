import { genHexString, getHashString } from "../lib/util";
import GameManifest from "./GameManifest";
import * as L from "leaflet";
import { GameState } from "./Game";
import Log from "ts/lib/log";

export interface MoveEventData{
	targetPos: L.LatLng;
	route: L.Routing.IRoute;
}

export interface QuestionAnswerEventData{
	answer: string; // What the user typed in
	response: string; // What the chatbot replied
	objectID: number;
}

export interface GameStateEventData{
	state: GameState;
}

export enum GameEventResponse{
	Ok,
	InvalidManifest,
	Invalid
}

export default class GameEvent{
	type: string;
	hash: string;
	manifestHash: string;
	data: any;
	origin: string;

	constructor(type: string, data?: any){
		this.type = type;
		this.data = data;
	}

	async createHash(){
		this.hash = await getHashString(Object.values(this));
	}
}
