import * as socketio from "socket.io-client";
import P2PLobby, { IceCandidate, RemoteSessionData, IceCandidateData, PeerData } from "./P2P";

type OnGameLobbyJoined = () => void;

export default class Socket{
	url: string = "http://localhost:8080";
	socket: socketio.Socket;
	p2p: P2PLobby;
	id: string;
	onGameLobbyJoined: OnGameLobbyJoined;

	constructor(){
		this.connectToServer();
	}

	connectToServer(){
		this.socket = socketio.io(`${this.url}`);
		this.initHandlers();
	}

	private initHandlers(){
		this.socket.on("connect", () => { this.onSocketConnect(); });
		this.socket.on("ServerLobbyJoined", () => { this.onGameLobbyJoined(); });
		this.socket.on("P2PAddPeer", (msg: PeerData) => { this.onP2PAddPeer(msg); })
		this.socket.on("P2PIceCandidate", (msg: IceCandidateData) => { this.onP2PIceCandidate(msg); });
		this.socket.on("P2PSessionDesc", (msg: RemoteSessionData) => { this.onP2PSessionDesc(msg); });
	}

	private onSocketConnect(){
		this.id = this.socket.id;
	}

	private onP2PAddPeer(msg: PeerData){
		this.p2p.addPeer(msg);
	}

	private onP2PIceCandidate(msg: IceCandidateData){
		this.p2p.iceCandidate(msg);
	}

	private onP2PSessionDesc(msg: RemoteSessionData){
		this.p2p.remoteSessionDesc(msg);
	}

	private emit(event: string, data?: object){
		this.socket.emit(event, data);
	}

	joinGameLobby(id: string){
		this.emit("ServerJoinLobby", { id });
	}

	P2PRelayICECandidate(peer: string, iceCandidate: IceCandidate){
		this.emit("P2PRelayIceCandidate", { peer, iceCandidate });
	}

	P2PRelaySessionDesc(peer: string, sessionDesc: RTCSessionDescriptionInit){
		this.emit("P2PRelaySessionDesc", { peer, sessionDesc });
	}

	P2PJoinLobby(){
		this.emit("P2PJoinLobby");
	}
}
