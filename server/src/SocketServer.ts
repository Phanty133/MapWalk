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

		socket.on("disconnect", () => { this.onSocketDisconnect(socket); })
		socket.on("ServerJoinLobby", (data: ServerJoinLobbyData) => { this.onServerJoinLobby(socket, data); });
		socket.on("P2PRelayIceCandidate", (data: P2PRelayIceCandidateData) => { this.onP2PRelayIceCandidate(socket, data); });
		socket.on("P2PRelaySessionDesc", (data: P2PRelaySessionDescData) => { this.onP2PRelaySessionDesc(socket, data); });
		socket.on("P2PJoinLobby", () => { this.onP2PJoinLobby(socket); });
		socket.on("ChatbotVerifyAnswer", (data: ChatbotVerifyAnswerData) => { this.onChatbotVerifyAnswer(socket, data); })
	}

	emit(id: string, event: string, msg?: object){
		this.sockets[id].emit(event, msg);
	}

	private onSocketDisconnect(socket: socketio.Socket){
		if(!this.lobbies[socket.id]) return;

		this.lobbies[socket.id].removePeer(socket.id);
	}

	private onServerJoinLobby(socket: socketio.Socket, msg: ServerJoinLobbyData){
		LobbyManager.joinLobby(msg.id, socket.id);
		socket.emit("ServerLobbyJoined");
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
}
