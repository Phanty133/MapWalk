import MapObject, { MapObjectData } from "ts/map/MapObject";
import { GameSettings } from "ts/ui/settingsUI/SettingsSelection";
import Game, { GameMode, GameState } from "./Game";
import GameEvent from "./GameEvent";
import { PlayerInfo, PlayerStats } from "./Player";
import hash from "object-hash";
import Log from "ts/lib/log";
import { RestObjectData } from "ts/map/RestObject";

export interface GameManifestData{
	players: Record<string, { info: PlayerInfo, stats: PlayerStats }>;
	turnIndex: number;
	curTime: number;
	gameSettings: GameSettings;
	state: GameState;
	mapObjectData: MapObjectData[];
	restObjectData: RestObjectData[];
	turnOrder: string[];
}

export default class GameManifest{ // Mainly of use only in multiplayer for game synchronization
	data: GameManifestData;
	events: string[] = []; // Hashes of applied events
	eventQueue: GameEvent[] = [];
	private game: Game;

	constructor(game: Game){
		this.game = game;
	}

	getHash(): string{
		this.updateManifestData();
		return hash.sha1(JSON.stringify(this.data)); // WHY DO I NEED TO STRINGIFY??????
	}

	updateManifestData(){
		const playerData: Record<string, { info: PlayerInfo, stats: PlayerStats }> = {};

		for(const id of Object.keys(this.game.playersByID)){
			const plyr = this.game.playersByID[id];
			playerData[id] = { info: plyr.info, stats: plyr.stats };
		}

		this.data = {
			players: playerData,
			curTime: this.game.clock.curTime,
			gameSettings: this.game.settings,
			state: this.game.state,
			mapObjectData: this.game.mapObjectData,
			restObjectData: this.game.restObjectData,
			turnIndex: this.game.turnMan.activeIndex,
			turnOrder: this.game.turnMan.playerOrder.map(plyr => plyr.info.socketID)
		};
	}

	loadFromManifestData(newData: GameManifestData){
		this.data = Object.assign({}, newData);

		this.game.mapObjectData = this.data.mapObjectData;
		this.game.settings = this.data.gameSettings;
		this.game.clock.curTime = this.data.curTime;
		this.game.loadGameState(this.data.state);

		this.game.map.clearObjects();
		this.game.map.createObjects(this.data.mapObjectData);

		if(this.game.settings.gamemode === GameMode.HundredPercentClock) this.game.map.createRestObjects(this.data.restObjectData);

		for(const plyrID of Object.keys(this.data.players)){
			this.game.playersByID[plyrID].updateInfo(this.data.players[plyrID].info)
			this.game.playersByID[plyrID].updateStats(this.data.players[plyrID].stats);
		}

		this.game.turnMan.setTurn(this.data.turnIndex, this.data.turnOrder);
	}
}
