import GameEvent, { GameStateEventData } from "./GameEvent";
import P2PLobby, { MessageData } from "ts/networking/P2PLobby";
import Lobby from "ts/networking/Lobby";
import GameManifest from "./GameManifest";
import P2PGameEventHandler from "./P2PGameEventHandler";
import Log from "ts/lib/log";
import TurnManager from "./TurnManager";
import Player from "./Player";
import GameMap from "ts/map/GameMap";
import { GameSettings } from "ts/ui/settingsUI/SettingsSelection";
import Clock from "./Clock";
import { MapObjectData } from "ts/map/MapObject";
import GameEndUI from "ts/ui/gameui/GameEndUI";
import Time from "./Time";
import Socket, { PlayerData } from "ts/networking/Socket";
import GameEventHandler, { GameEventData } from "./GameEventHandler";
import ChatBoot from "./ChatBoot";

type ManifestCheckCompleteCallback = () => void;

export enum GameState {
	Idle,
	PlayerAction, // The player(s) can do something
	PlayerInteracting,
	PlayerActionComplete,
	Loading, // The game is waiting for something
	Sync, // The game is synchronizing/checking manifests
	Paused // The game is paused obviously
}

export enum GameMode {
	TimeAttack,
	HundredPercent,
	HundredPercentClock
}

export default class Game {
	lobby: Lobby;
	p2p: P2PLobby;
	manifest: GameManifest;
	p2pEventHandler: P2PGameEventHandler;
	manifestCheckActive: boolean = false;
	private receivedManifests: Record<string, string> = {}; // {PeerID:manifestHash}
	public onManifestCheckComplete: ManifestCheckCompleteCallback = () => { };
	private settings: GameSettings;
	private mapObjectData: MapObjectData[];
	gameEndUI: GameEndUI;
	isMultiplayer: boolean = false;
	private _state: GameState = GameState.Loading;
	turnMan: TurnManager;
	localPlayer: Player;
	otherPlayers: Player[] = [];
	playersByID: Record<string, Player> = {};
	map: GameMap;
	clock: Clock;
	gameEnd: boolean = false;
	socket: Socket;
	eventHandler: GameEventHandler;
	chatBot: ChatBoot;

	public get state(): GameState{
		return this._state;
	}

	constructor(settings: GameSettings, socket: Socket, lobby?: Lobby){
		this.manifest = new GameManifest();

		if(lobby) {
			this.lobby = lobby;
			this.p2p = this.lobby.p2p;
			this.isMultiplayer = true;
		}

		this.settings = settings;
		this.socket = socket;
		this.eventHandler = new GameEventHandler(this);
		this.clock = new Clock();
		this.turnMan = new TurnManager(this);

		if(this.isMultiplayer){
			// this.p2pEventHandler = new P2PGameEventHandler(this);

			/*
			this.eventHandler.onEvent = (e: GameEvent) => {
				Log.log("Game event received: " + e.type);

				if (this.manifestCheckActive) {
					// Put the event in a queue
					this.manifest.eventQueue.push(e);
				}
				else {
					// Apply the event
					this.manifest.events.push(e);
					// TODO: do something else
				}
			}

			this.eventHandler.onEventAccepted = (e: GameEvent) => {
				Log.log("Game event accepted!");

				if (this.manifestCheckActive) {
					// Put the event in a queue
					this.manifest.eventQueue.push(e);
				}
				else {
					// Apply the event
					this.manifest.events.push(e);
					// TODO: do something else
				}
			}

			this.eventHandler.onEventDeclined = (e: GameEvent) => {
				Log.log("Game event declined!");
			}

			this.eventHandler.eventVerifiers.test = (checkEvent: GameEvent) => {
				return true;
			}

			if(!P2PLobby.debugHost){
				setTimeout(() => {
					const ev: GameEvent = new GameEvent("test", "Hello world!");
					this.eventHandler.dispatchEvent(ev);
				}, 1500);
			} */

			this.onManifestCheckComplete = () => {
				Log.log("manifest check complete!");
				this.eventHandler.dispatchEvent(new GameEvent("test", "Hello world!"));
			};

			this.bindP2PEvents();
		}
	}

	createMap(objects?: MapObjectData[]){
		this.map = new GameMap("map", this);
		this.mapObjectData = objects;
	}

	createPlayer(pos: L.LatLng, socketID?: string, plyrData?: PlayerData): Player{
		const plyr = new Player(this.map, this, pos, socketID, plyrData);

		plyr.events.on("MoveDone", () => {
			this.map.moveDone();
		});

		this.turnMan.addPlayer(plyr);

		if(socketID){
			this.playersByID[socketID] = plyr;
		}

		return plyr;
	}

	checkManifest() {
		if (this.manifestCheckActive) return;

		this.manifestCheckActive = true;
		Log.log("Syncing game manifest");

		this.p2p.broadcast({ cmd: "getManifestHash" });
	}

	private bindP2PEvents(){
		this.p2p.bindToChannel("checkManifest", (data: MessageData.CheckManifest) => {
			this.checkManifest();
		});

		this.p2p.bindToChannel("getManifestHash", async (data: MessageData.GetManifestHash, channel: RTCDataChannel) => {
			Log.log("Sending manifest hash");
			const manifestHash = await this.manifest.getHash();

			P2PLobby.send(channel, { cmd: "sendManifestHash", manifestHash });
		});

		this.p2p.bindToChannel("sendManifestHash", async (data: MessageData.SendManifestHash) => {
			if (!this.manifestCheckActive) return;

			this.receivedManifests[data.peer] = data.manifestHash;

			// Continue only after all manifests have been received
			if (Object.keys(this.receivedManifests).length !== Object.keys(this.p2p.peers).length) return;

			const hashCount: Record<string, number> = {};
			const selfManifestHash: string = await this.manifest.getHash();
			let consensusHash: string = Object.values(this.receivedManifests)[0];
			let maxHashCount: number = 1;

			hashCount[selfManifestHash] = 1; // Also account for own hash

			for (const hash of Object.values(this.receivedManifests)) {
				if (hash in hashCount) {
					if (++hashCount[hash] > maxHashCount) {
						consensusHash = hash;
						maxHashCount = hashCount[hash];
					}
				}
				else {
					hashCount[hash] = 1;
				}
			}

			if (selfManifestHash === consensusHash) {
				this.manifestCheckActive = false;
				this.receivedManifests = {};
				return;
			}

			Log.log("Self manifest hash doesn't match consensus hash!");

			const peerWithConsensus = Object.keys(this.receivedManifests).find(id => this.receivedManifests[id] === consensusHash);

			P2PLobby.send(this.p2p.channels[peerWithConsensus], { cmd: "getManifestData" });
			this.receivedManifests = {};
		});

		this.p2p.bindToChannel("getManifestData", (data: MessageData.GetManifest, channel: RTCDataChannel) => {
			P2PLobby.send(channel, { cmd: "sendManifestData", manifestData: this.manifest.data });
		});

		this.p2p.bindToChannel("sendManifestData", async (data: MessageData.SendManifest) => {
			if (!this.manifestCheckActive) return;
			this.manifestCheckActive = false;

			// Apply the new manifest
			this.manifest.data = data.manifestData;

			// Apply all unapplied events
			// The manifestHash for each event is the hash of the state of the GameManifest when the event should've been applied.
			// This allows it to apply the events in the desired order

			let curManifestHash: string = await this.manifest.getHash();

			while (this.manifest.eventQueue.length > 0) {
				const nextEventIndex = this.manifest.eventQueue.findIndex(e => e.manifestHash === curManifestHash);

				if (nextEventIndex === null) {
					Log.error("uh oh - unable to find an event with given manifest hash - desync error!");
				}

				// Apply the event
				this.manifest.events.push(this.manifest.eventQueue[nextEventIndex]);
				// TODO: do something else

				delete this.manifest.eventQueue[nextEventIndex];

				if (this.manifest.eventQueue.length > 0) {
					// Recalculate hash if there are events in queue
					curManifestHash = await this.manifest.getHash();
				}
			}

			this.onManifestCheckComplete();
		});

		this.eventHandler.on("GameState", (e: GameEventData) => {
			this._state = e.event.data.state;
			this.turnMan.update();
		});
	}

	checkGameEndCondition() {
		switch (this.settings.gamemode) {
			case GameMode.TimeAttack:
				if (this.clock.curTime >= this.settings.timeLimit) {
					this.onGameEnd();
					return;
				}
				break;
			case GameMode.HundredPercent:
				if (this.localPlayer.stats.score === this.mapObjectData.length) {
					this.onGameEnd();
					return;
				}
				break;
			case GameMode.HundredPercentClock:
				// this is something
				break;
		}
	}

	onGameEnd() {
		this.gameEnd = true;
		Time.paused = true;
		this.gameEndUI.show();
	}

	setGameState(newState: GameState){
		const stateEvData: GameStateEventData = { state: newState };

		this.eventHandler.dispatchEvent(new GameEvent("GameState", stateEvData));
	}
}
