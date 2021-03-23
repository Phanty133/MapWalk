import * as Cookies from "js-cookie";
import Socket from "./Socket";
import P2PLobby, { MessageData } from "./P2PLobby";
import Log from "ts/lib/log";

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

		// const game = new Game(this);

		if(!socket){
			this.socket.joinGameLobby(this.id, Cookies.get("username"));
		}
	}

	static createLobby(){
		window.location.replace("/createLobby");
	}
}
