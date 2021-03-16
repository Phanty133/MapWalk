import "css/index.css"
import { Map } from "ts/map/map"
import Lobby from "ts/networking/Lobby"
import * as Cookies from "js-cookie"

document.body.onload = () => {
	const map = new Map("map");
	let lobby;

	const lobbyCookie = Cookies.get("lobby");

	if (lobbyCookie) {
		lobby = new Lobby(lobbyCookie);
		// tslint:disable-next-line: no-console
		console.log(lobby.id);
		Cookies.remove("lobby");
	}
};
