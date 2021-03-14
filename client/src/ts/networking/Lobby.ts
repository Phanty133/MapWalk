import * as Cookies from "js-cookie";
import Socket from "./Socket";
import P2PLobby from "./P2P";

export default class Lobby{
	id: string;
	p2p: P2PLobby;
	socket: Socket;

	constructor(id: string){
		this.id = id;
		this.socket = new Socket();
		this.p2p = new P2PLobby(this.socket);
		this.socket.p2p = this.p2p;

		this.socket.onGameLobbyJoined = () => {
			this.p2p.joinLobby();
		};

		this.socket.joinGameLobby(this.id);
	}

	static createLobby(){
		window.location.replace("/createLobby");
	}
}