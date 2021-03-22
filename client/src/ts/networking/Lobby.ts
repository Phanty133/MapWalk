import * as Cookies from "js-cookie";
import Socket from "./Socket";
import P2PLobby, { MessageData } from "./P2PLobby";

export default class Lobby{
	id: string;
	p2p: P2PLobby;
	socket: Socket;

	constructor(id: string, socket?:Socket){
		this.id = id;

		if(!socket) {
			this.socket = new Socket();
		}
		else{
			this.socket = socket;
		}

		this.p2p = new P2PLobby(this.socket);
		this.socket.p2p = this.p2p;

		this.socket.onGameLobbyJoined = () => {
			this.p2p.joinLobby();
		};

		// const game = new Game(this);
		this.socket.joinGameLobby(this.id);
	}

	static createLobby(){
		window.location.replace("/createLobby");
	}
}
