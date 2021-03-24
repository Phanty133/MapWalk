import GameEvent, { GameEventResponse } from "ts/game/GameEvent";
import GameManifest, { GameManifestData } from "ts/game/GameManifest";
import { randInt } from "ts/lib/util";
import Socket from "./Socket";
import Log from "ts/lib/log";
import { EventEmitter } from "events";
import "webrtc-adapter";

export interface PeerData{
	peer: string; // SocketID?
	createOffer: boolean;
}

export interface RemoteSessionData{
	peer: string;
	sessionDesc: RTCSessionDescriptionInit;
}

export interface IceCandidate{
	sdpMLineIndex: number;
	candidate: string;
}

export interface IceCandidateData{
	peer: string;
	iceCandidate: IceCandidate;
}

interface MessageDataBase{
	cmd: string;
	peer: string;
}

// tslint:disable-next-line: no-namespace
export namespace MessageData{
	export interface Init extends MessageDataBase{
		status: string;
	}

	export interface  Event extends MessageDataBase{
		event: GameEvent;
	}

	export interface EventResponse extends MessageDataBase{
		response: GameEventResponse;
		manifestHash: string;
		key?: JsonWebKey;
		eventHash: string;
	}

	export interface  EventEffect extends MessageDataBase{
		key: JsonWebKey;
		event: GameEvent;
	}

	export interface  GetManifestHash extends MessageDataBase{}

	export interface  SendManifestHash extends MessageDataBase{
		manifestHash: string;
	}

	export interface  GetManifest extends MessageDataBase{}

	export interface  SendManifest extends MessageDataBase{
		manifestData: GameManifestData;
	}

	export interface  CheckManifest extends MessageDataBase{}

	export interface ChatMessage extends MessageDataBase{
		content: string;
		authorSocketID: string;
	}
}

type MessageCallback = (data: MessageDataBase, channel?:RTCDataChannel) => void;

export default class P2PLobby{
	static ICE_SERVERS: any[] = [{"urls": ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"]}, {"urls": "turn:45.9.188.93:5349", "username": "guest", "credential": "somepassword"}];
	peers: Record<string, RTCPeerConnection> = {};
	channels: Record<string, RTCDataChannel> = {};
	socket: Socket;
	channelBinds: Record<string, MessageCallback[]> = {};
	joinedLobby: boolean = false;
	events: EventEmitter = new EventEmitter();
	static debugHost: boolean = false;

	constructor(socket: Socket){
		this.socket = socket;

		this.bindToChannel("init", (msgData: MessageData.Init, channel: RTCDataChannel) => {
			Log.log("Init " + msgData.status);
			this.events.emit("Connection");
		});
	}

	joinLobby(){
		if(this.joinedLobby) return;

		this.socket.P2PJoinLobby();
	}

	private createDataChannel(peer: string): Promise<RTCDataChannel>{
		return new Promise<RTCDataChannel>((res, rej) => {
			const channel = this.peers[peer].createDataChannel(`data-${randInt(0, 100)}`);

			channel.onopen = () => {
				Log.log("Channel open");
				P2PLobby.send(channel, { cmd: "init", status: "OK" });
				res(channel);
			};

			channel.onclose = () => {
				Log.log("Channel close");
			};

			P2PLobby.debugHost = true;

			channel.onmessage = (e: MessageEvent) => { this.messageHandler(peer, e); };
		});
	}

	async addPeer(data: PeerData){
		if(data.peer in this.peers){
			// tslint:disable-next-line: no-console
			console.warn("Already connected to peer ", data.peer);
			return;
		}

		const peerConnection: RTCPeerConnection = new RTCPeerConnection({ iceServers: P2PLobby.ICE_SERVERS });
		this.peers[data.peer] = peerConnection;

		peerConnection.onicecandidate = (e) => {
			if(e.candidate){
				this.socket.P2PRelayICECandidate(data.peer, { sdpMLineIndex: e.candidate.sdpMLineIndex, candidate: e.candidate.candidate });
			}
		};

		peerConnection.ontrack = (e) => {
			// tslint:disable-next-line: no-console
			Log.log("Connected track " + e);
			// TODO: actually make it do something when connected
		};

		peerConnection.onconnectionstatechange = (e: Event) => {
			const state = peerConnection.connectionState;

			switch(state){
				case "failed":
					Log.log("Peer lost connection");
					break;
				case "disconnected":
					Log.log("Peer disconnected");
					this.channels[data.peer].close();
					this.peers[data.peer].close();

					delete this.peers[data.peer];
					delete this.channels[data.peer];
					break;
				case "closed":
					Log.log("Peer connection closed");
					delete this.peers[data.peer];
					delete this.channels[data.peer];
			}
		};

		// peerConnection.addTrack();

		if(data.createOffer){
			this.createDataChannel(data.peer)
				.then((channel: RTCDataChannel) => {
					this.channels[data.peer] = channel;
				});

			const localDesc = await peerConnection.createOffer();

			await peerConnection.setLocalDescription(localDesc);
			this.socket.P2PRelaySessionDesc(data.peer, localDesc);
		}
		else{
			peerConnection.ondatachannel = (e: RTCDataChannelEvent) => {
				Log.log("Data channel received");
				Log.log(e.channel.label);

				e.channel.onmessage = (msgEv: MessageEvent) => { this.messageHandler(data.peer, msgEv); };
				this.channels[data.peer] = e.channel;
				P2PLobby.send(e.channel, { cmd: "init", status: "OK" });
			};
		}
	}

	iceCandidate(data: IceCandidateData){
		this.peers[data.peer].addIceCandidate(new RTCIceCandidate(data.iceCandidate));
	}

	async remoteSessionDesc(data: RemoteSessionData){
		const desc = new RTCSessionDescription(data.sessionDesc);
		const peer = this.peers[data.peer];

		await peer.setRemoteDescription(desc);

		if(data.sessionDesc.type === "offer"){
			const localDesc = await peer.createAnswer();

			await peer.setLocalDescription(localDesc);
			this.socket.P2PRelaySessionDesc(data.peer, localDesc);
		}
	}

	private messageHandler(peer: string, e: MessageEvent){
		const args = JSON.parse(e.data);

		if(args.cmd in this.channelBinds){
			args.peer = peer;

			for(const cb of this.channelBinds[args.cmd]){
				cb(args, e.target as RTCDataChannel);
			}
		}
	}

	bindToChannel(cmd: string, cb: MessageCallback){
		if(this.channelBinds[cmd]){
			this.channelBinds[cmd].push(cb);
		}
		else{
			this.channelBinds[cmd] = [cb];
		}
	}

	removeBindFromChannel(cmd: string, cb: MessageCallback){
		const i = this.channelBinds[cmd].findIndex(e => e === cb)
		this.channelBinds[cmd].splice(i, 1);
	}

	static send(channel: RTCDataChannel, data: object){
		channel.send(JSON.stringify(data));
	}

	broadcast(data: object){
		for(const channel of Object.values(this.channels)){
			P2PLobby.send(channel, data);
		}
	}
}
