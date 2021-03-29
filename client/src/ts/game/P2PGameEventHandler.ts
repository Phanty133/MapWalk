import Log from "ts/lib/log";
import P2PLobby, { MessageData } from "ts/networking/P2PLobby";
import Game from "./Game";
import GameEvent, { GameEventResponse } from "./GameEvent";
import GameManifest from "./GameManifest";

type EventVerificationCallback = (event: GameEvent) => Promise<void>;
type EventEffectCallback = (event: GameEvent, origin: string) => Promise<void>;
type EventVerifier = (event: GameEvent, game?: Game) => Promise<boolean>;

export default class P2PGameEventHandler{
	private game: Game;
	private p2p: P2PLobby;
	private manifest: GameManifest;
	private static encryptionAlgorithm: RsaHashedKeyAlgorithm = {
		name: "RSASSA-PKCS1-v1_5",
		modulusLength: 512,
		hash: { name: "SHA-1" },
		publicExponent: new Uint8Array([1, 0, 1])
	}
	private eventSignatures: Record<string, ArrayBuffer> = {}; // Event hash : GameEvent
	private eventResponse: Record<string, MessageData.EventResponse[]> = {};
	private activeEvents: Record<string, GameEvent> = {}; // Event hash : GameEvent
	public onEventAccepted: EventVerificationCallback = () => { return new Promise((res, rej) => { res(); }); };
	public onEventDeclined: EventVerificationCallback = () => { return new Promise((res, rej) => { res(); }); };
	public onEventEffect: EventEffectCallback = () => { return new Promise((res, rej) => { res(); }); };
	public eventVerifiers: Record<string, EventVerifier> = {};
	private eventCache: string[] = []; // IDs of cached events. Used to give process responses only when all previous events have been applied
	private eventEffectQueue: MessageData.EventEffect[] = []; // A queue for event effects. Used to apply them in order
	private waitingOnEvent: boolean = false;
	private dispatchQueue: GameEvent[] = [];

	constructor(game: Game){
		this.game = game;
		this.p2p = this.game.lobby.p2p;
		this.manifest = this.game.manifest;

		this.p2p.bindToChannel("event", async (data: MessageData.Event, channel: RTCDataChannel) => {
			Log.log("Received event");
			Log.log(data);

			const manifestHash: string = await this.manifest.getHash();

			if(manifestHash !== data.event.manifestHash){
				Log.log("Manifests don't match");
				P2PLobby.send(channel, { cmd: "eventResponse", eventHash: data.event.hash, response: GameEventResponse.InvalidManifest, manifestHash });
				return;
			}

			let eventValid: boolean;

			if(!(data.event.type in this.eventVerifiers)){
				Log.log(`Unknown event - ${data.event.type}`);
				eventValid = false;
			}
			else{
				eventValid = await this.eventVerifiers[data.event.type](data.event, this.game);
			}

			let response: GameEventResponse = GameEventResponse.Invalid;
			let publicKey;

			if(eventValid){
				response = GameEventResponse.Ok;

				this.manifest.events.push(data.event.hash);

				const keypair = await this.genEventKeypair();
				publicKey = await crypto.subtle.exportKey("jwk", keypair.publicKey);
				const textEncoder = new TextEncoder();

				this.eventSignatures[data.event.hash] = await crypto.subtle.sign(
					P2PGameEventHandler.encryptionAlgorithm,
					keypair.privateKey,
					textEncoder.encode(data.event.hash)
				);
			}

			// Send the event origin the response with authorization for further action
			P2PLobby.send(channel, { cmd: "eventResponse", response, manifestHash, eventHash: data.event.hash, key: publicKey });
		});

		this.p2p.bindToChannel("eventResponse", async (data: MessageData.EventResponse, channel: RTCDataChannel) => {
			if(!this.eventResponse[data.eventHash]){
				this.eventResponse[data.eventHash] = [];
			}

			this.eventResponse[data.eventHash].push(data);

			// If all event responses haven't been received, don't go further
			if(this.eventResponse[data.eventHash].length !== Object.keys(this.p2p.peers).length) return;

			if(Object.keys(this.eventResponse).length > 1){ // If there's an event before this one, cache the current one
				this.eventCache.push(data.eventHash);
				return;
			}
			else{
				this.processEventResponses(data.eventHash);
			}
		});

		this.p2p.bindToChannel("eventEffect", async (data: MessageData.EventEffect) => {
			Log.log(`Event (${data.event.type}) effect received!`);
			Log.log(data);

			if(!data.key){
				Log.log("Authorization key missing! shitty hax0r alert");
				return;
			}

			this.eventEffectQueue.push(data);

			if(this.eventEffectQueue.length === 1){
				this.processEventEffect(this.eventEffectQueue[0]);
			}
		});
	}

	private async processEventResponses(eventHash: string){
		// Find the consensus hash

		Log.log(this.activeEvents);
		Log.log(eventHash);

		const hashCount: Record<string, number> = {};
		const selfManifestHash: string = this.activeEvents[eventHash].manifestHash; // Get the original manifest hash
		let consensusHash: string = selfManifestHash;
		let maxHashCount: number = 1;

		hashCount[selfManifestHash] = 1; // Also account for own hash

		for(const res of this.eventResponse[eventHash]){
			if(res.manifestHash in hashCount){
				if(++hashCount[res.manifestHash] > maxHashCount){
					consensusHash = res.manifestHash;
					maxHashCount = hashCount[res.manifestHash];
				}
			}
			else{
				hashCount[res.manifestHash] = 1;
			}
		}

		// Validate self hash

		if(selfManifestHash !== consensusHash){
			Log.log("Own hash doesn't match the consensus hash!");
			this.game.checkManifest(this.activeEvents[eventHash]);
		}
		else{
			// Review event responses

			let eventOKCount = 0;

			for(const res of this.eventResponse[eventHash]){
				if(res.manifestHash !== consensusHash){
					Log.log("--------");
					Log.log(`Peer's (${res.peer}) hash doesn't match the consensus hash!`);
					Log.log(`Consensus hash: ${consensusHash}`);
					Log.log(`Peer's hash: ${res.manifestHash}`);
					Log.log(`Local manifest`);
					Log.log(this.game.manifest.data);
					Log.log("--------");
					P2PLobby.send(this.p2p.channels[res.peer], { cmd: "checkManifest", triggerEvent: this.activeEvents[eventHash] });
					continue;
				}

				if(res.response === GameEventResponse.Ok) eventOKCount++;
			}

			if(eventOKCount >= Math.ceil(this.eventResponse[eventHash].length / 2)){
				Log.log(`Event (${this.activeEvents[eventHash].type}) was valid!`);

				for(const res of this.eventResponse[eventHash]){
					const targetChannel = this.p2p.channels[res.peer];

					P2PLobby.send(targetChannel, { cmd: "eventEffect", event: this.activeEvents[eventHash], key: res.key });
				}

				await this.onEventAccepted(this.activeEvents[eventHash]);
			}
			else{
				Log.log("Event was invalid!");
				this.onEventDeclined(this.activeEvents[eventHash]);
			}

			if(this.eventCache.length > 0){
				const nextEvHash: string = this.eventCache[0];
				this.processEventResponses(nextEvHash);
				this.eventCache.splice(0, 1);
			}
		}

		delete this.activeEvents[eventHash];
		delete this.eventResponse[eventHash];

		if(this.dispatchQueue.length > 0){
			this.processEventDispatch(this.dispatchQueue.shift());
		}
	}

	private async processEventEffect(data: MessageData.EventEffect){
		Log.log("effect!");

		const signature = this.eventSignatures[data.event.hash];
		const dataToBeVerified = new TextEncoder().encode(data.event.hash);
		const publicKey = await crypto.subtle.importKey("jwk", data.key, P2PGameEventHandler.encryptionAlgorithm, false, ["verify"]);
		const result = await crypto.subtle.verify(P2PGameEventHandler.encryptionAlgorithm, publicKey, signature, dataToBeVerified);

		if(result){
			Log.log(`Event (${data.event.type}) effect authorized!`);
			Log.log("effect1");
			await this.onEventEffect(data.event, data.peer);
			Log.log("effect2");
		}
		else{
			Log.log(`Event (${data.event.type}) effect unauthorized!`);
		}

		delete this.eventSignatures[data.event.hash];
		this.eventEffectQueue.shift();
		// delete this.activeEvents[data.event.hash];

		if(this.eventEffectQueue.length > 0){
			this.processEventEffect(this.eventEffectQueue[0]);
		}
	}

	private async genEventKeypair(): Promise<CryptoKeyPair>{
		return await crypto.subtle.generateKey(P2PGameEventHandler.encryptionAlgorithm, true, ["sign", "verify"]);
	}

	async dispatchEvent(event: GameEvent){
		if(this.waitingOnEvent){
			this.dispatchQueue.push(event);
			return;
		}

		this.processEventDispatch(event);
	}

	private processEventDispatch(event: GameEvent){
		this.activeEvents[event.hash] = event;

		const hash = this.manifest.getHash();
		event.manifestHash = hash;
		event.origin = this.game.socket.id;

		Log.log(`Sending event (${event.type})`);
		Log.log(event);
		this.p2p.broadcast({ cmd: "event", event });
	}
}
