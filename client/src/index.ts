import "css/index.css"
import Map, { ObjectData } from "ts/map/map"
import Lobby from "ts/networking/Lobby"
import * as Cookies from "js-cookie"
import Game, { GameState } from "ts/game/Game"
import Player from "ts/game/Player"
import Time from "ts/game/Time"
import SettingsSelection, { GameSettings } from "ts/ui/settingsUI/SettingsSelection"
import LobbyUI from "ts/ui/lobby/LobbyUI"
import randomizeActionButtons from "ts/ui/forthememe"
import { randInt } from "ts/lib/util"
import Clock from "ts/game/Clock";
import { bindGameUI } from "ts/ui/gameui/BindGameUI"

document.body.onload = () => {
	if(new URLSearchParams(window.location.search).get("mode") === "mp"){
		const lobbyUI = new LobbyUI();
	}
	else{
		const settingsSelection = new SettingsSelection();
		settingsSelection.open();

		settingsSelection.onStart = (settings: GameSettings) => {
			settingsSelection.close();
			document.getElementById("game'ntContainer").style.display = "none";
			document.getElementById("game").style.display = "block";

			loadGame(settings);
		};
	}

	const cb = () => {
		randomizeActionButtons();
		setTimeout(cb, randInt(5000, 10000));
	};

	cb();
};

async function loadObjects(count: number): Promise<ObjectData[]>{
	const req = await fetch(`/objects?count=${count}`);
	return await req.json();
}

async function loadGame(settings: GameSettings){
	const objects = await loadObjects(settings.objectCount);
	const map = new Map("map", objects);
	let lobby: Lobby;
	let game: Game;

	const lobbyCookie = Cookies.get("lobby");

	if (lobbyCookie) {
		lobby = new Lobby(lobbyCookie);
		game = new Game(map, settings, lobby);
		// tslint:disable-next-line: no-console
		console.log(lobby.id);
		Cookies.remove("lobby");
	}
	else {
		game = new Game(map, settings);
	}

	const time = new Time();

	game.state = GameState.PlayerAction;
	bindGameUI(game);
}
