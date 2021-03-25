import SocketServer, { P2PRelayIceCandidateData, P2PRelaySessionDescData, ServerLobbyChatMessageData, ServerLobbyColorChangeData, ServerLobbyKickData, ServerLobbyMakeHostData, ServerLobbySettingsChangedData, ServerLobbyStartGameData } from "./SocketServer";
import { genHexString, randomArrayElements } from "./lib/util";
import { logger, mapObjectLoader } from "./index";
import { Socket } from "socket.io";
import LobbyManager from "./LobbyManager";

type SocketCallback = (socket: Socket) => void;

export interface PlayerData{
	socketID: string;
	username: string;
	isHost: boolean;
	color: string;
}

export default class Lobby{
	id: string;
	sockets: string[] = [];
	socketServer: SocketServer;
	players: PlayerData[] = [];
	playersBySocket: Record<string, PlayerData> = {};

	constructor(socketServer: SocketServer, idLen: number = 6){
		// this.id = genHexString(idLen);
		this.id = "aaaaaa";
		this.socketServer = socketServer;
	}

	private forAll(cb: SocketCallback, ignore: string = null){
		for(const socket of this.sockets){
			if(socket === ignore) continue;
			cb(this.socketServer.sockets[socket]);
		}
	}

	private broadcast(event: string, data: any, ignore: string = null){
		this.forAll((socket: Socket) => {
			socket.emit(event, data);
		}, ignore);
	}

	removePeer(socketID: string){
		if(this.players.length > 1){
			this.broadcast("ServerLobbyUserDisconnected", { socketID });

			if(this.playersBySocket[socketID].isHost){
				// If it is the host, make the host the next player in the players array
				this.serverLobbyMakeHost(socketID, { socketID: this.players[1].socketID });
			}
		}
		else{
			LobbyManager.removeLobby(this.id);
		}

		this.sockets.splice(this.sockets.findIndex(s => s === socketID), 1);
	}

	joinLobby(socketID: string){
		this.sockets.push(socketID);
		this.socketServer.lobbies[socketID] = this;
	}

	P2PAddPeer(peer: string){
		this.forAll((socket: Socket) => {
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

	newPlayer(origin: string, data: PlayerData){
		this.players.push(data);
		this.playersBySocket[origin] = data;

		logger.info(this.players);
		this.broadcast("ServerLobbyNewPlayer", data, origin);
	}

	serverLobbyChangeColor(origin: string, data: ServerLobbyColorChangeData){
		if(this.players.find(plyrData => plyrData.color === data.color)) return;

		this.broadcast("ServerLobbyChangeColor", data, origin);
		this.playersBySocket[origin].color = data.color;
	}

	serverLobbyMakeHost(origin: string, data: ServerLobbyMakeHostData){
		if(!this.playersBySocket[origin].isHost) return;

		this.playersBySocket[origin].isHost = false;
		this.playersBySocket[data.socketID].isHost = true;

		this.broadcast("ServerLobbyMakeHost", data);
	}

	serverLobbyKick(origin: string, data: ServerLobbyKickData){
		if(!this.playersBySocket[origin].isHost) return;

		this.socketServer.sockets[data.socketID].emit("ServerLobbyKicked");
		this.socketServer.sockets[data.socketID].disconnect();

		const plyrData = this.playersBySocket[data.socketID];

		this.players.splice(this.players.findIndex(pData => pData === plyrData), 1);
		delete this.playersBySocket[data.socketID];

		this.broadcast("ServerLobbyKick", data);
	}

	serverLobbyChatMessage(data: ServerLobbyChatMessageData){
		this.broadcast("ServerLobbyChatMessage", Object.assign({ username: this.playersBySocket[data.authorSocketID].username }, data));
	}

	serverLobbyStartGame(origin: string, data: ServerLobbyStartGameData){
		if(!this.playersBySocket[origin].isHost) return;

		// Generate objects and starting locations

		const objects = mapObjectLoader.getRandomObjects(data.settings.objectCount);
		const randomStartingObjects = randomArrayElements(objects, this.players.length);
		const randomStartingCoordinates = randomStartingObjects.map(obj => obj.location);
		const playerStartingCoordinates: Record<string, any> = {}; // SocketID: LatLng Location

		this.players.forEach((plyr: PlayerData, i: number) => {
			playerStartingCoordinates[plyr.socketID] = randomStartingCoordinates[i];
		});

		// Generate turn order

		const randomizedPlayerOrder = randomArrayElements(this.players, this.players.length);
		const randomizedPlayerOrderData = randomizedPlayerOrder.map(plyr => plyr.socketID);

		this.broadcast("ServerLobbyStartGame", Object.assign({
			objects,
			playerCoords: playerStartingCoordinates,
			playerOrder: randomizedPlayerOrderData,
			playerSettings: this.playersBySocket
		}, data));
	}

	serverLobbySettingsChanged(origin: string, data: ServerLobbySettingsChangedData){
		if(!this.playersBySocket[origin].isHost) return;

		this.broadcast("ServerLobbySettingsChanged", data, origin);
	}
}
