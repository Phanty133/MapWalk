import * as socketio from "socket.io-client";
import P2PLobby, { IceCandidate, RemoteSessionData, IceCandidateData, PeerData } from "./P2PLobby";
import { EventEmitter } from "events";
import Log from "ts/lib/log";
import * as L from "leaflet";
import { GameSettings } from "ts/ui/settingsUI/SettingsSelection";
import { MapObjectData } from "ts/map/MapObject";
import { RestObjectData } from "ts/map/RestObject";

export interface PlayerData {
	username: string;
	socketID: string;
	isHost: boolean;
	color?: string;
};

export interface ServerLobbyColorChangeData{
	color: string;
	socketID: string;
}

export interface ServerLobbyMakeHostData{
	socketID: string;
}

export interface ServerLobbyKickData{
	socketID: string;
}

export interface ServerLobbyChatMessageData{
	authorSocketID: string;
	username: string;
	content: string;
}

export interface ServerLobbyJoinedData{
	lobbyId: string;
	players: PlayerData[];
}

export interface ServerLobbyStartGameData{
	settings: GameSettings;
	objects: MapObjectData[];
	playerCoords: Record<string, L.LatLng>; // SocketID : Location
	playerOrder: string[]; // An array of socket ids of the players
	playerSettings: Record<string, PlayerData>;
	restObjects: RestObjectData[];
}

export interface ServerLobbyUserDisconnectedData{
	socketID: string
}

export interface ServerLobbySettingsChangedData{
	settings: GameSettings;
}

export default class Socket{
	url: string = "https://mapwalk.tk";
	socket: socketio.Socket;
	p2p: P2PLobby;
	id: string;
	events: EventEmitter = new EventEmitter();

	constructor(){
		this.connectToServer();
	}

	connectToServer(){
		this.socket = socketio.io(`${this.url}`);
		this.initHandlers();
	}

	private initHandlers(){
		this.socket.on("connect", () => { this.onSocketConnect(); });
		this.socket.on("ChatbotVerifyAnswerResponse", (msg: { response: string }) => { this.onChatbotVerifyAnswerResponse(msg); });

		// Websocket player communication

		this.socket.on("ServerLobbyJoined", (data: ServerLobbyJoinedData) => { this.onServerLobbyJoined(data); });
		this.socket.on("ServerLobbyNewPlayer", (data: PlayerData) => { this.onServerLobbyNewPlayer(data); });
		this.socket.on("ServerLobbyChangeColor", (data: ServerLobbyColorChangeData) => { this.onServerLobbyChangeColor(data); });
		this.socket.on("ServerLobbyKick", (data: ServerLobbyKickData) => { this.onServerLobbyKick(data); });
		this.socket.on("ServerLobbyMakeHost", (data: ServerLobbyMakeHostData) => { this.onServerLobbyMakeHost(data); });
		this.socket.on("ServerLobbyChatMessage", (data: ServerLobbyChatMessageData) => { this.onServerLobbyChatMessage(data); });
		this.socket.on("ServerLobbyStartGame", (data: ServerLobbyStartGameData) => { this.onServerLobbyStartGame(data); });
		this.socket.on("ServerLobbyKicked", () => { this.onServerLobbyKicked(); });
		this.socket.on("ServerLobbyUserDisconnected", (data: ServerLobbyUserDisconnectedData) => { this.onServerLobbyUserDisconnected(data); });
		this.socket.on("ServerLobbySettingsChanged", (data: ServerLobbySettingsChangedData) => { this.onServerLobbySettingsChanged(data); });

		// WebRTC signaling

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

	private onChatbotVerifyAnswerResponse(msg: { response: string }){
		Log.log("chatbot resp: " + msg.response);
		this.events.emit("ChatbotVerifyAnswerResponse", msg.response);
	}

	private onServerLobbyJoined(data: ServerLobbyJoinedData){
		this.events.emit("ServerLobbyJoined", data);
	}

	private onServerLobbyNewPlayer(data: PlayerData){
		this.events.emit("ServerLobbyNewPlayer", data);
	}

	private onServerLobbyChangeColor(data: ServerLobbyColorChangeData){
		this.events.emit("ServerLobbyColorChange", data);
	}

	private onServerLobbyMakeHost(data: ServerLobbyMakeHostData){
		this.events.emit("ServerLobbyMakeHost", data);
	}

	private onServerLobbyKick(data: ServerLobbyKickData){
		this.events.emit("ServerLobbyKick", data);
	}

	private onServerLobbyChatMessage(data: ServerLobbyChatMessageData){
		this.events.emit("ServerLobbyChatMessage", data);
	}

	private onServerLobbyKicked(){
		this.events.emit("ServerLobbyKicked");
	}

	private onServerLobbyStartGame(data: ServerLobbyStartGameData){
		this.events.emit("ServerLobbyStartGame", data);
	}

	private onServerLobbyUserDisconnected(data: ServerLobbyUserDisconnectedData){
		this.events.emit("ServerLobbyUserDisconnected", data);
	}

	private onServerLobbySettingsChanged(data: ServerLobbySettingsChangedData){
		this.events.emit("ServerLobbySettingsChanged", data);
	}

	private emit(event: string, data?: object){
		this.socket.emit(event, data);
	}

	joinGameLobby(id: string, username: string){
		this.emit("ServerJoinLobby", { id, username });
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

	chatbotVerifyAnswer(msg: string){
		this.emit("ChatbotVerifyAnswer", { msg });
	}

	serverLobbyChangeColor(color: string){
		this.emit("ServerLobbyChangeColor", { color, socketID: this.socket.id });
	}

	serverLobbyMakeHost(targetSocketID: string){
		this.emit("ServerLobbyMakeHost", { socketID: targetSocketID });
	}

	serverLobbyKick(targetSocketID: string){
		this.emit("ServerLobbyKick", { socketID: targetSocketID });
	}

	serverLobbyChatMessage(content: string){
		this.emit("ServerLobbyChatMessage", { content, authorSocketID: this.socket.id });
	}

	serverLobbyStartGame(settings: GameSettings){
		this.emit("ServerLobbyStartGame", { settings });
	}

	serverLobbySettingsChanged(settings: GameSettings){
		this.emit("ServerLobbySettingsChanged", { settings });
	}
}
