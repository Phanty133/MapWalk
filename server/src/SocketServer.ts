import { Server } from "http";
import socketio from "socket.io";
import { logger, chatBoot } from "./index";
import LobbyManager from "./LobbyManager";
import Lobby from "./Lobby";

export interface IceCandidate{
	sdpMLineIndex: number;
	candidate: string;
}

interface ServerJoinLobbyData{
	id: string;
	username: string;
}

export interface P2PRelayIceCandidateData{
	peer: string;
	iceCandidate: IceCandidate;
}

export interface P2PRelaySessionDescData{
	peer: string;
	sessionDesc: RTCSessionDescriptionInit;
}

export interface ChatbotVerifyAnswerData{
	msg: string;
}

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
	content: string;
}

export interface ServerLobbyStartGameData{
	settings: GameSettings;
}

export interface GameSettings{
	mode: string;
	gamemode: any; // Not important
	location: any; // Not important
	objectCount: number;
	timeLimit?: number;
}

export default class SocketServer{
	io: socketio.Server;
	sockets: Record<string, socketio.Socket> = {}; // {socketID: socket}
	lobbies: Record<string, Lobby> = {}; // {socketID: lobby}

	constructor(http: Server){
		this.io = new socketio.Server(http);

		this.io.on("connection", (socket) => { this.onConnection(socket); });
	}

	onConnection(socket: socketio.Socket){
		this.sockets[socket.id] = socket;
		logger.info("Connected to socket!");

		// Interplayer communication stuff

		socket.on("ServerJoinLobby", (data: ServerJoinLobbyData) => { this.onServerJoinLobby(socket, data); });
		socket.on("ServerLobbyChangeColor", (data: ServerLobbyColorChangeData) => { this.onServerLobbyChangeColor(socket, data); });
		socket.on("ServerLobbyMakeHost", (data: ServerLobbyMakeHostData) => { this.onServerLobbyMakeHost(socket, data); });
		socket.on("ServerLobbyKick", (data: ServerLobbyKickData) => { this.onServerLobbyKick(socket, data); });
		socket.on("ServerLobbyChatMessage", (data: ServerLobbyChatMessageData) => { this.onServerLobbyChatMessage(socket, data); });
		socket.on("ServerLobbyStartGame", (data: ServerLobbyStartGameData) => { this.onServerLobbyStartGame(socket, data); });

		// WebRTC signaling stuff

		socket.on("P2PRelayIceCandidate", (data: P2PRelayIceCandidateData) => { this.onP2PRelayIceCandidate(socket, data); });
		socket.on("P2PRelaySessionDesc", (data: P2PRelaySessionDescData) => { this.onP2PRelaySessionDesc(socket, data); });
		socket.on("P2PJoinLobby", () => { this.onP2PJoinLobby(socket); });

		// Other stuff

		socket.on("ChatbotVerifyAnswer", (data: ChatbotVerifyAnswerData) => { this.onChatbotVerifyAnswer(socket, data); });
		socket.on("disconnect", () => { this.onSocketDisconnect(socket); });
	}

	emit(id: string, event: string, msg?: object){
		this.sockets[id].emit(event, msg);
	}

	private onSocketDisconnect(socket: socketio.Socket){
		if(!this.lobbies[socket.id]) return;

		this.lobbies[socket.id].removePeer(socket.id);
	}

	private onServerJoinLobby(socket: socketio.Socket, msg: ServerJoinLobbyData){
		if(!LobbyManager.joinLobby(msg.id, socket.id)) return;

		this.lobbies[socket.id].newPlayer(socket.id, {
			socketID: socket.id,
			username: msg.username,
			isHost: this.lobbies[socket.id].players.length === 0,
			color: ""
		});

		socket.emit("ServerLobbyJoined", { players: this.lobbies[socket.id].players, lobbyId: this.lobbies[socket.id].id });
	}

	private onP2PJoinLobby(socket: socketio.Socket){
		if(!this.lobbies[socket.id]) return;

		this.lobbies[socket.id].P2PAddPeer(socket.id);
	}

	private onP2PRelayIceCandidate(socket: socketio.Socket, msg: P2PRelayIceCandidateData){
		if(!this.lobbies[socket.id]) return;

		this.lobbies[socket.id].P2PRelayICECandidate(socket.id, msg);
	}

	private onP2PRelaySessionDesc(socket: socketio.Socket, msg: P2PRelaySessionDescData){
		if(!this.lobbies[socket.id]) return;

		this.lobbies[socket.id].P2PRelaySessionDesc(socket.id, msg);
	}

	private onChatbotVerifyAnswer(socket: socketio.Socket, msg: ChatbotVerifyAnswerData){
		const chatbotAns = chatBoot.processMessage(msg.msg);

		socket.emit("ChatbotVerifyAnswerResponse", { response: chatbotAns });
	}

	private onServerLobbyChangeColor(socket: socketio.Socket, data: ServerLobbyColorChangeData){
		if(!this.lobbies[socket.id]) return;

		this.lobbies[socket.id].serverLobbyChangeColor(socket.id, data);
	}

	private onServerLobbyChatMessage(socket: socketio.Socket, data: ServerLobbyChatMessageData){
		if(!this.lobbies[socket.id]) return;

		this.lobbies[socket.id].serverLobbyChatMessage(data);
	}

	private onServerLobbyKick(socket: socketio.Socket, data: ServerLobbyKickData){
		if(!this.lobbies[socket.id]) return;

		this.lobbies[socket.id].serverLobbyKick(socket.id, data);
	}

	private onServerLobbyMakeHost(socket: socketio.Socket, data: ServerLobbyMakeHostData){
		if(!this.lobbies[socket.id]) return;

		this.lobbies[socket.id].serverLobbyMakeHost(socket.id, data);
	}

	private onServerLobbyStartGame(socket: socketio.Socket, data: ServerLobbyStartGameData){
		if(!this.lobbies[socket.id]) return;

		this.lobbies[socket.id].serverLobbyStartGame(socket.id, data);
	}
}
