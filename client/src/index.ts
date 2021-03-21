import "css/index.css"
import Map from "ts/map/map"
import { MapObjectData } from "ts/map/MapObject"
import Lobby from "ts/networking/Lobby"
import * as Cookies from "js-cookie"
import Game, { GameState } from "ts/game/Game"
import Time from "ts/game/Time"
import SettingsSelection, { GameSettings } from "ts/ui/settingsUI/SettingsSelection"
import LobbyUI from "ts/ui/lobby/LobbyUI"
import randomizeActionButtons from "ts/ui/forthememe"
import { randInt } from "ts/lib/util"
import { bindGameUI } from "ts/ui/gameui/BindGameUI"
import ChatBoot from "ts/game/ChatBoot"
import { bindChatBoot } from "ts/ui/gameui/ChatbotUI"

document.body.onload = () => {
	loadPreGame();

	const cb = () => {
		randomizeActionButtons();
		setTimeout(cb, randInt(5000, 10000));
	};

	cb();
};

function loadPreGame() {
	if (new URLSearchParams(window.location.search).get("mode") === "mp") {
		const lobbyUI = new LobbyUI();
	}
	else {
		const settingsSelection = new SettingsSelection();
		settingsSelection.open();

		settingsSelection.onStart = (settings: GameSettings) => {
			settingsSelection.close();
			document.getElementById("game'ntContainer").style.display = "none";
			document.getElementById("game").style.display = "block";

			loadGame(settings);
		};
	}
}

async function loadObjects(count: number): Promise<MapObjectData[]> {
	const req = await fetch(`/objects?count=${count}`);
	return await req.json();
}

async function loadGame(settings: GameSettings) {
	let lobby: Lobby;
	let game: Game;

	const lobbyCookie = Cookies.get("lobby");

	if (lobbyCookie) {
		lobby = new Lobby(lobbyCookie);
		game = new Game(settings, lobby);
		// tslint:disable-next-line: no-console
		console.log(lobby.id);
		Cookies.remove("lobby");
	}
	else {
		game = new Game(settings);
	}

	const objects = await loadObjects(settings.objectCount);
	game.createMap(objects);
	game.createPlayer();

	const time = new Time();
	game.state = GameState.PlayerAction;

	const chatBoot = new ChatBoot();

	bindChatBoot(chatBoot);
	bindGameUI(game);
}
