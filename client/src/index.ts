import "css/index.css"
import Map from "ts/map/map"
import Lobby from "ts/networking/Lobby"
import * as Cookies from "js-cookie"
import Game, { GameState } from "ts/game/Game"
import Player from "ts/game/Player"
import Time from "ts/game/Time"

document.body.onload = () => {
	const map = new Map("map");
	let lobby: Lobby;
	let game: Game;

	const lobbyCookie = Cookies.get("lobby");

	if (lobbyCookie) {
		lobby = new Lobby(lobbyCookie);
		game = new Game(lobby);
		// tslint:disable-next-line: no-console
		console.log(lobby.id);
		Cookies.remove("lobby");
	}
	else {
		game = new Game();
	}

	const plyr = new Player(map, game);
	const time = new Time();

	game.turnMan.playerOrder = [ plyr ];
	game.state = GameState.PlayerAction;
};
