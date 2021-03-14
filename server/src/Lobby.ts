import { randomInt } from "crypto";
import SocketServer, { P2PRelayIceCandidateData, P2PRelaySessionDescData } from "./SocketServer";
import { genHexString } from "./lib/util";
import { logger } from "./index";
import { Socket } from "socket.io";

type SocketCallback = (socket: Socket) => void;

export default class Lobby{
	id: string;
	sockets: string[] = [];
	socketServer: SocketServer;

	constructor(socketServer: SocketServer, idLen: number = 6){
		// this.id = genHexString(idLen);
		this.id = "aaaaaa";
		this.socketServer = socketServer;
	}

	private broadcast(cb: SocketCallback, ignore: string = null){
		for(const socket of this.sockets){
			if(socket === ignore) continue;
			cb(this.socketServer.sockets[socket]);
		}
	}

	joinLobby(socketID: string){
		this.sockets.push(socketID);
		this.socketServer.lobbies[socketID] = this;
	}

	P2PAddPeer(peer: string){
		this.broadcast((socket: Socket) => {
			socket.emit("P2PAddPeer", { peer, createOffer: false });
			this.socketServer.sockets[peer].emit("P2PAddPeer", { peer: socket.id, createOffer: true });
		}, peer);
	}

	P2PRelayICECandidate(origin: string, data: P2PRelayIceCandidateData){
		this.socketServer.sockets[data.peer].emit("P2PIceCandidate", { peer: origin, iceCandidate: data.iceCandidate });
	}

	P2PRelaySessionDesc(origin: string, data: P2PRelaySessionDescData){
		this.socketServer.sockets[data.peer].emit("P2PSessionDesc", { peer: origin, sessionDesc: data.sessionDesc });
	}
}