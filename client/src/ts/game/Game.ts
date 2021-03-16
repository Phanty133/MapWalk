import GameEvent from "./GameEvent";
import P2PLobby, { MessageData } from "ts/networking/P2PLobby";
import Lobby from "ts/networking/Lobby";
import GameManifest from "./GameManifest";
import GameEventHandler from "./GameEventHandler";

type ManifestCheckCompleteCallback = () => void;

export default class Game{
	lobby: Lobby;
	p2p: P2PLobby;
	manifest: GameManifest;
	eventHandler: GameEventHandler;
	manifestCheckActive: boolean = false;
	private receivedManifests: Record<string, string> = {}; // {PeerID:manifestHash}
	public onManifestCheckComplete: ManifestCheckCompleteCallback = () => {};

	constructor(lobby: Lobby){
		this.lobby = lobby;
		this.p2p = this.lobby.p2p;
		this.manifest = new GameManifest();
		this.eventHandler = new GameEventHandler(this);

		this.eventHandler.onEvent = (e: GameEvent) => {
			console.log("Game event received: ", e.type);

			if(this.manifestCheckActive){
				// Put the event in a queue
				this.manifest.eventQueue.push(e);
			}
			else{
				// Apply the event
				this.manifest.events.push(e);
				// TODO: do something else
			}
		}

		this.eventHandler.onEventAccepted = (e: GameEvent) => {
			console.log("Game event accepted!");

			if(this.manifestCheckActive){
				// Put the event in a queue
				this.manifest.eventQueue.push(e);
			}
			else{
				// Apply the event
				this.manifest.events.push(e);
				// TODO: do something else
			}
		}

		this.eventHandler.onEventDeclined = (e: GameEvent) => {
			console.log("Game event declined!");
		}

		this.eventHandler.eventVerifiers.test = (checkEvent: GameEvent) => {
			return true;
		}

		this.bindEvents();

		if(!P2PLobby.debugHost){
			setTimeout(() => {
				const ev: GameEvent = new GameEvent("test", "Hello world!");
				this.eventHandler.dispatchEvent(ev);
			}, 1500);
		}

		this.onManifestCheckComplete = () => {
			console.log("manifest check complete!");
			this.eventHandler.dispatchEvent(new GameEvent("test", "Hello world!"));
		};
	}

	checkManifest(){
		if(this.manifestCheckActive) return;

		this.manifestCheckActive = true;
		console.log("Syncing game manifest");

		this.p2p.broadcast({ cmd: "getManifestHash" });
	}

	private bindEvents(){
		this.p2p.bindToChannel("checkManifest", (data: MessageData.CheckManifest) => {
			this.checkManifest();
		});

		this.p2p.bindToChannel("getManifestHash", async (data: MessageData.GetManifestHash, channel: RTCDataChannel) => {
			console.log("Sending manifest hash");
			const manifestHash = await this.manifest.getHash();

			P2PLobby.send(channel, { cmd: "sendManifestHash", manifestHash });
		});

		this.p2p.bindToChannel("sendManifestHash", async (data: MessageData.SendManifestHash) => {
			if(!this.manifestCheckActive) return;

			this.receivedManifests[data.peer] = data.manifestHash;

			// Continue only after all manifests have been received
			if(Object.keys(this.receivedManifests).length !== Object.keys(this.p2p.peers).length) return;

			const hashCount: Record<string, number> = {};
			const selfManifestHash: string = await this.manifest.getHash();
			let consensusHash: string = Object.values(this.receivedManifests)[0];
			let maxHashCount: number = 1;

			hashCount[selfManifestHash] = 1; // Also account for own hash

			for(const hash of Object.values(this.receivedManifests)){
				if(hash in hashCount){
					if(++hashCount[hash] > maxHashCount){
						consensusHash = hash;
						maxHashCount = hashCount[hash];
					}
				}
				else{
					hashCount[hash] = 1;
				}
			}

			if(selfManifestHash === consensusHash){
				this.manifestCheckActive = false;
				this.receivedManifests = {};
				return;
			}

			console.log("Self manifest hash doesn't match consensus hash!");

			const peerWithConsensus = Object.keys(this.receivedManifests).find(id => this.receivedManifests[id] === consensusHash);

			P2PLobby.send(this.p2p.channels[peerWithConsensus], { cmd: "getManifestData" });
			this.receivedManifests = {};
		});

		this.p2p.bindToChannel("getManifestData", (data: MessageData.GetManifest, channel: RTCDataChannel) => {
			P2PLobby.send(channel, {cmd: "sendManifestData", manifestData: this.manifest.data});
		});

		this.p2p.bindToChannel("sendManifestData", async (data: MessageData.SendManifest) => {
			if(!this.manifestCheckActive) return;
			this.manifestCheckActive = false;

			// Apply the new manifest
			this.manifest.data = data.manifestData;

			// Apply all unapplied events
			// The manifestHash for each event is the hash of the state of the GameManifest when the event should've been applied.
			// This allows it to apply the events in the desired order

			let curManifestHash: string = await this.manifest.getHash();

			while(this.manifest.eventQueue.length > 0){
				const nextEventIndex = this.manifest.eventQueue.findIndex(e => e.manifestHash === curManifestHash);

				if(nextEventIndex === null){
					console.error("uh oh - unable to find an event with given manifest hash - desync error!");
				}

				// Apply the event
				this.manifest.events.push(this.manifest.eventQueue[nextEventIndex]);
				// TODO: do something else

				delete this.manifest.eventQueue[nextEventIndex];

				if(this.manifest.eventQueue.length > 0){
					// Recalculate hash if there are events in queue
					curManifestHash = await this.manifest.getHash();
				}
			}

			this.onManifestCheckComplete();
		});
	}
}
