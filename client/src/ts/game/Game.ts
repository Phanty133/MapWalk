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
import { EventEmitter } from "events";
import { RestObjectData } from "ts/map/RestObject";

type ManifestCheckCompleteCallback = () => void;

export enum GameState {
	Idle,
	PlayerAction, // The player(s) can do something
	PlayerInteracting,
	PlayerActionComplete,
	Loading, // The game is waiting for something
	Sync, // The game is synchronizing/checking manifests
	Paused, // The game is paused, obviously
	Ended
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
	settings: GameSettings;
	mapObjectData: MapObjectData[];
	gameEndUI: GameEndUI;
	isMultiplayer: boolean = false;
	private _state: GameState = GameState.Loading;
	private _prevState: GameState = GameState.Idle;
	turnMan: TurnManager;
	localPlayer: Player;
	otherPlayers: Player[] = [];
	players: Player[] = [];
	playersByID: Record<string, Player> = {};
	map: GameMap;
	clock: Clock;
	gameEnd: boolean = false;
	socket: Socket;
	eventHandler: GameEventHandler;
	chatBot: ChatBoot;
	events: EventEmitter = new EventEmitter();
	restObjectData: RestObjectData[];

	public get state(): GameState{
		return this._state;
	}

	public get prevState(): GameState{
		return this._prevState;
	}

	constructor(settings: GameSettings, socket: Socket, lobby?: Lobby){
		this.manifest = new GameManifest(this);

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
				Log.log("Manifest check complete!");
				this.manifest.events = [];
			};

			this.bindP2PEvents();
		}

		this.bindEvents();
	}

	createMap(objects: MapObjectData[], restObjects: RestObjectData[]){
		this.map = new GameMap("map", this);
		this.mapObjectData = [...objects];
		this.restObjectData = [...restObjects];
	}

	createPlayer(pos: L.LatLng, socketID?: string, plyrData?: PlayerData): Player{
		const plyr = new Player(this.map, this, pos, socketID, plyrData);

		this.turnMan.addPlayer(plyr);

		if(socketID){
			this.playersByID[socketID] = plyr;
		}

		this.players.push(plyr);

		return plyr;
	}

	checkManifest(triggerEvent: GameEvent) {
		this.manifest.eventQueue.push(triggerEvent);

		if (this.manifestCheckActive) return;

		// this._state = GameState.Sync;
		// this.turnMan.update();

		this.manifestCheckActive = true;

		Log.log("--------");
		Log.log("Syncing game manifest");
		Log.log(`Local manifest`);
		Log.log(this.manifest.data);
		Log.log(`Local hash: ${this.manifest.getHash()}`);
		Log.log("--------");

		this.p2p.broadcast({ cmd: "getManifestHash" });
	}

	private bindEvents(){
		this.eventHandler.on("GameState", async (e: GameEventData) => {
			this._state = e.event.data.state;
			this.turnMan.update();

			this.events.emit("GameStateChanged", this.state, this.prevState);
		});

		this.eventHandler.on("GameEnd", async (e: GameEventData) => {
			this.gameEnd = true;
			Time.paused = true;
			this.gameEndUI.show();
		});
	}

	private bindP2PEvents(){
		this.p2p.bindToChannel("checkManifest", (data: MessageData.CheckManifest) => {
			this.checkManifest(data.triggerEvent);
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
			const selfManifestHash: string = this.manifest.getHash();
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
			Log.log("Sending manifest data: ");
			Log.log(Object.assign({}, this.manifest.data));
			P2PLobby.send(channel, { cmd: "sendManifestData", manifestData: this.manifest.data });
		});

		this.p2p.bindToChannel("sendManifestData", async (data: MessageData.SendManifest) => {
			if (!this.manifestCheckActive) return;
			this.manifestCheckActive = false;

			Log.log("Prev manifest");
			Log.log(this.manifest.data);
			// Apply the new manifest
			this.manifest.loadFromManifestData(data.manifestData);
			Log.log("New manifest");
			Log.log(this.manifest.data);

			// Apply all unapplied events
			// The manifestHash for each event is the hash of the state of the GameManifest when the event should've been applied.
			// This allows it to apply the events in the desired order

			let curManifestHash: string = await this.manifest.getHash();

			Log.log("Event queue");
			Log.log([...this.manifest.eventQueue]);

			while (this.manifest.eventQueue.length > 0) {
				/* const nextEventIndex = this.manifest.eventQueue.findIndex(e => e.manifestHash === curManifestHash);

				if (nextEventIndex === -1) {
					Log.error("uh oh - unable to find an event with given manifest hash - desync error!");
				} */

				// Apply the event
				const ev = this.manifest.eventQueue.shift();

				if(this.manifest.events.includes(ev.hash)) continue;

				this.manifest.events.push(ev.hash);
				await this.eventHandler.eventEffectHandler(ev);

				if (this.manifest.eventQueue.length > 0) {
					// Recalculate hash if there are events in queue
					curManifestHash = this.manifest.getHash();
				}
			}

			this.onManifestCheckComplete();
		});
	}

	checkGameEndCondition() {
		if(this.verifyGameEndCondition()) this.onGameEnd();
	}

	verifyGameEndCondition(): boolean{
		switch (this.settings.gamemode) {
			case GameMode.TimeAttack:
				if (this.clock.curTime >= this.settings.timeLimit) {
					return true;
				}
				break;
			case GameMode.HundredPercent:
				if (this.map.countAnsweredObjects() === this.mapObjectData.length) {
					return true;
				}
				break;
			case GameMode.HundredPercentClock:
				// this is something

				break;
		}

		return false;
	}

	onGameEnd() {
		this.eventHandler.dispatchEvent(new GameEvent("GameEnd"));
	}

	setGameState(newState: GameState){
		const stateEvData: GameStateEventData = { state: newState };

		this.eventHandler.dispatchEvent(new GameEvent("GameState", stateEvData));
	}

	loadGameState(loadedState: GameState){
		this._prevState = this._state;
		this._state = loadedState;
		this.turnMan.update();
	}
}
