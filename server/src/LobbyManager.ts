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

	static joinLobby(lobbyID: string, socketID: string){
		LobbyManager.lobbies[lobbyID].joinLobby(socketID);
	}

	static removeLobby(lobbyID: string){
		delete this.lobbies[lobbyID];
	}
}