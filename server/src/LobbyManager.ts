import Lobby from "./Lobby";
import { Socket } from "socket.io";
import { logger, socketServer } from "./index";

export default class LobbyManager{
	static lobbies: Record<string, Lobby> = {};

	static createLobby(): Lobby{
		const newLobby: Lobby = new Lobby(socketServer);
		LobbyManager.lobbies[newLobby.id] = newLobby;

		return newLobby;
	}

	static joinLobby(lobbyID: string, socketID: string): boolean{
		if(!(lobbyID in LobbyManager.lobbies)) return false;
		if(LobbyManager.lobbies[lobbyID].sockets.includes(socketID)) return false;

		LobbyManager.lobbies[lobbyID].joinLobby(socketID);

		return true;
	}

	static removeLobby(lobbyID: string){
		delete this.lobbies[lobbyID];
	}
}
