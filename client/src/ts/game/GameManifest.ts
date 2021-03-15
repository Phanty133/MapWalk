import GameEvent from "./GameEvent";

export interface GameManifestData{
	val1: string;
	val2: number;
	val3: number[]
}

function uint8ToHex(uint8: Uint8Array){
	return Array.from(uint8).map(int8 => int8.toString(16).slice(-1)).join("");
}

export default class GameManifest{
	data: GameManifestData;
	events: GameEvent[] = [];
	eventQueue: GameEvent[] = [];

	constructor(){
		this.data = {
			val1: "Hello world!",
			val2: 69,
			val3: [1, 3, 3, 7]
		};
	}

	async getHash(): Promise<string>{
		const digest = await crypto.subtle.digest("SHA-1", Uint8Array.from(Object.values(this.data)));
		return uint8ToHex(new Uint8Array(digest));
	}
}
