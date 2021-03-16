import { genHexString } from "../lib/util";
import GameManifest from "./GameManifest";

export enum GameEventResponse{
	Ok,
	InvalidManifest,
	Invalid
}

export default class GameEvent{
	type: string;
	id: string;
	data: string;
	manifestHash: string;

	constructor(type: string, data: string){
		this.type = type;
		this.id = genHexString(8);
		this.data = data;
	}
}
