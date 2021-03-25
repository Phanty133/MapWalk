import MapObject, { MapObjectData } from "ts/map/MapObject";
import { GameSettings } from "ts/ui/settingsUI/SettingsSelection";
import Game, { GameState } from "./Game";
import GameEvent from "./GameEvent";
import { PlayerInfo, PlayerStats } from "./Player";
import hash from "object-hash";
import Log from "ts/lib/log";

export interface GameManifestData{
	players: Record<string, { info: PlayerInfo, stats: PlayerStats }>;
	curTime: number;
	gameSettings: GameSettings;
	state: GameState;
	mapObjectData: MapObjectData[];
}

export default class GameManifest{ // Mainly of use only in multiplayer for game synchronization
	data: GameManifestData;
	events: GameEvent[] = [];
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
			mapObjectData: this.game.mapObjectData
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

		for(const plyrID of Object.keys(this.data.players)){
			this.game.playersByID[plyrID].updateInfo(this.data.players[plyrID].info)
			this.game.playersByID[plyrID].updateStats(this.data.players[plyrID].stats);
		}
	}
}
