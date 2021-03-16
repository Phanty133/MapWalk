import P2PLobby, { MessageData } from "ts/networking/P2PLobby";
import Game from "./Game";
import GameEvent, { GameEventResponse } from "./GameEvent";
import GameManifest from "./GameManifest";

type EventVerificationCallback = (event: GameEvent) => void;
type EventCallback = (event: GameEvent) => void;
type EventVerifier = (event: GameEvent, game?: Game) => boolean;

export default class GameEventHandler{
	private game: Game;
	private p2p: P2PLobby;
	private manifest: GameManifest;
	private static encryptionAlgorithm: RsaHashedKeyAlgorithm = {
		name: "RSASSA-PKCS1-v1_5",
		modulusLength: 512,
		hash: { name: "SHA-1" },
		publicExponent: new Uint8Array([1, 0, 1])
	}
	private eventSignatures: Record<string, ArrayBuffer> = {};
	private eventResponse: MessageData.EventResponse[] = [];
	private activeEvent: GameEvent;
	public onEventAccepted: EventVerificationCallback = () => {};
	public onEventDeclined: EventVerificationCallback = () => {};
	public onEvent: EventCallback = () => {};
	public eventVerifiers: Record<string, EventVerifier> = {};

	constructor(game: Game){
		this.game = game;
		this.p2p = this.game.lobby.p2p;
		this.manifest = this.game.manifest;

		this.p2p.bindToChannel("event", async (data: MessageData.Event, channel: RTCDataChannel) => {
			console.log("Received event: ", data);

			const manifestHash: string = await this.manifest.getHash();

			if(manifestHash !== data.event.manifestHash){
				console.log("Manifests don't match");
				P2PLobby.send(channel, { cmd: "eventResponse", response: GameEventResponse.InvalidManifest, manifestHash });
				return;
			}

			let eventValid: boolean;

			if(!(data.event.type in this.eventVerifiers)){
				console.log("Unknown event!");
				eventValid = false;
			}
			else{
				eventValid = this.eventVerifiers[data.event.type](data.event, this.game);
			}

			let response: GameEventResponse = GameEventResponse.Invalid;
			let publicKey;

			if(eventValid){
				response = GameEventResponse.Ok;

				this.manifest.events.push(data.event);

				const keypair = await this.genEventKeypair();
				publicKey = await crypto.subtle.exportKey("jwk", keypair.publicKey);
				const textEncoder = new TextEncoder();

				this.eventSignatures[data.event.id] = await crypto.subtle.sign(
					GameEventHandler.encryptionAlgorithm,
					keypair.privateKey,
					textEncoder.encode(data.event.id)
				);
			}

			// Send the event origin the response with authorization for further action
			P2PLobby.send(channel, { cmd: "eventResponse", response, manifestHash, key: publicKey });
		});

		this.p2p.bindToChannel("eventResponse", async (data: MessageData.EventResponse, channel: RTCDataChannel) => {
			this.eventResponse.push(data);

			// If all event responses haven't been received, don't go further
			if(this.eventResponse.length !== Object.keys(this.p2p.peers).length) return;

			// Find the consensus hash

			const hashCount: Record<string, number> = {};
			const selfManifestHash: string = await this.manifest.getHash();
			let consensusHash: string = selfManifestHash;
			let maxHashCount: number = 1;

			hashCount[selfManifestHash] = 1; // Also account for own hash

			for(const res of this.eventResponse){
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
				console.log("Own hash doesn't match the consensus hash!");
				this.game.checkManifest();
				return;
			}

			// Review event responses

			let eventOKCount = 0;

			for(const res of this.eventResponse){
				if(res.manifestHash !== consensusHash){
					console.log(`Peer's (${res.peer}) hash doesn't match the consensus hash!`);
					P2PLobby.send(this.p2p.channels[res.peer], { cmd: "checkManifest" });
					continue;
				}

				if(res.response === GameEventResponse.Ok) eventOKCount++;
			}

			if(eventOKCount >= Math.ceil(this.eventResponse.length / 2)){
				console.log("Event was valid!");

				for(const res of this.eventResponse){
					const targetChannel = this.p2p.channels[res.peer];

					P2PLobby.send(targetChannel, { cmd: "eventEffect", event: this.activeEvent, key: res.key });
				}

				this.onEventAccepted(this.activeEvent);
			}
			else{
				console.log("Event was invalid!");
				this.onEventDeclined(this.activeEvent);
			}

			this.eventResponse = [];
		});

		this.p2p.bindToChannel("eventEffect", async (data: MessageData.EventEffect) => {
			console.log("Event effect received!");

			if(!data.key){
				console.log("Authorization key missing! shitty hax0r alert");
				return;
			}

			const signature = this.eventSignatures[data.event.id];
			const dataToBeVerified = new TextEncoder().encode(data.event.id);
			const publicKey = await crypto.subtle.importKey("jwk", data.key, GameEventHandler.encryptionAlgorithm, false, ["verify"]);
			const result = await crypto.subtle.verify(GameEventHandler.encryptionAlgorithm, publicKey, signature, dataToBeVerified);

			if(result){
				console.log("Event effect authorized!");
				this.onEvent(data.event);
			}
			else{
				console.log("Event effect unauthorized! hax0r alert");
			}

			delete this.eventSignatures[data.event.id];
			this.activeEvent = null;
		});
	}

	private async genEventKeypair(): Promise<CryptoKeyPair>{
		return await crypto.subtle.generateKey(GameEventHandler.encryptionAlgorithm, true, ["sign", "verify"]);
	}

	async dispatchEvent(event: GameEvent){
		this.activeEvent = event;

		const hash = await this.manifest.getHash();
		event.manifestHash = hash;

		this.p2p.broadcast({ cmd: "event", event });
	}
}
