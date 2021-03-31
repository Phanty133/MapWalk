import "css/index.css"

import iconEnergy from "img/IconEnergy.svg"
import iconScore from "img/IconScore.svg"

import { MapObjectData } from "ts/map/MapObject"
import Lobby from "ts/networking/Lobby"
import * as Cookies from "js-cookie"
import Game, { GameMode, GameState } from "ts/game/Game"
import Time from "ts/game/Time"
import SettingsSelection, { GameSettings } from "ts/ui/settingsUI/SettingsSelection"
import LobbyUI from "ts/ui/lobby/LobbyUI"
import randomizeActionButtons from "ts/ui/forthememe"
import { randInt } from "ts/lib/util"
import { bindGameUI } from "ts/ui/gameui/BindGameUI"
import ChatBoot from "ts/game/ChatBoot"
import Socket, { ServerLobbyStartGameData } from "ts/networking/Socket"
import * as L from "leaflet";
import Log from "ts/lib/log"
import bindEventVerifiers from "ts/game/EventVerifiers"
import { RestObjectData } from "ts/map/RestObject"

document.body.onload = () => {
	loadPreGame();

	const cb = () => {
		randomizeActionButtons();
		setTimeout(cb, randInt(5000, 10000));
	};

	cb();

	loadIcons();
};

function loadPreGame() {
	const socket = new Socket();

	if (new URLSearchParams(window.location.search).get("mode") === "mp") {
		const lobbyUI = new LobbyUI(socket);
		const lobbyCookie = Cookies.get("lobby");

		if (!lobbyCookie) {
			window.location.href = "/";
			return;
		}

		Cookies.remove("lobby");

		socket.joinGameLobby(lobbyCookie, Cookies.get("username"));

		socket.events.addListener("ServerLobbyStartGame", (data: ServerLobbyStartGameData) => {
			loadMPGame(lobbyCookie, data, socket);
		});
	}
	else {
		const settingsSelection = new SettingsSelection();
		settingsSelection.open();

		settingsSelection.onStart = (settings: GameSettings) => {
			settingsSelection.close();

			loadSPGame(settings, socket);
		};
	}
}

async function loadObjects(count: number): Promise<MapObjectData[]> {
	const req = await fetch(`/objects`, {
		method: "POST",
		body: `count=${count}`,
		headers: { "Content-type": "application/x-www-form-urlencoded" }
	});

	return await req.json();
}

async function loadRestObjects(count: number): Promise<RestObjectData[]> {
	const req = await fetch(`/restobjects`, {
		method: "POST",
		body: `count=${count}`,
		headers: { "Content-type": "application/x-www-form-urlencoded" }
	});

	return await req.json();
}

function openGameView() {
	document.getElementById("gamentContainer").style.display = "none";
	document.getElementById("game").style.display = "block";

}

async function loadSPGame(settings: GameSettings, socket: Socket) {
	openGameView();
	Log.log("singleplayer");

	const game = new Game(settings, socket);
	const objects = await loadObjects(settings.objectCount);
	const restObjects = await loadRestObjects(8);

	game.createMap(objects, restObjects);
	game.localPlayer = game.createPlayer(settings.location.pos);
	game.localPlayer.createFogOfWar();
	// game.localPlayer.fow.revealAll();

	Log.log(settings);
	Log.log(objects);
	Log.log(restObjects);
	game.map.createObjects(objects);

	if(settings.gamemode === GameMode.HundredPercentClock){
		game.map.createRestObjects(restObjects);
	}

	const time = new Time();
	game.setGameState(GameState.PlayerAction);

	const chatBoot = new ChatBoot(game);
	game.chatBot = chatBoot;

	bindGameUI(game);
}

async function loadMPGame(lobbyID: string, gameData: ServerLobbyStartGameData, socket: Socket) {
	openGameView();
	Log.log("multiplayer");

	const lobby = new Lobby(lobbyID, socket);
	const game = new Game(gameData.settings, socket, lobby);
	// const restObjects = await loadRestObjects(8);

	game.createMap(gameData.objects, gameData.restObjects);

	// Load the players

	for (const plyrSocket of gameData.playerOrder) {
		const coordObj = gameData.playerCoords[plyrSocket];
		const coord = new L.LatLng(coordObj.lat, coordObj.lng);
		const plyr = game.createPlayer(coord, plyrSocket, gameData.playerSettings[plyrSocket]);

		if (plyrSocket === socket.id) {
			game.localPlayer = plyr
			game.map.map.panTo(coord);
		}
		else {
			game.otherPlayers.push(plyr);
		}
	}

	game.localPlayer.createFogOfWar();
	// game.localPlayer.fow.revealAll();

	game.map.createObjects(gameData.objects);

	if(gameData.settings.gamemode === GameMode.HundredPercentClock){
		game.map.createRestObjects(gameData.restObjects);
	}

	const time = new Time();

	const chatBoot = new ChatBoot(game);
	game.chatBot = chatBoot;

	bindGameUI(game);
	bindEventVerifiers(game.p2pEventHandler);

	lobby.p2p.joinLobby();

	lobby.p2p.events.on("Connection", () => {
		if (Object.values(lobby.p2p.channels).length === gameData.playerOrder.length - 1) {
			Log.log("All players connected!");

			if (game.turnMan.activePlayer === game.localPlayer) {
				game.setGameState(GameState.PlayerAction);
			}
		}
	});
}

function loadIcons(){ // jank
	document.getElementById("iconEnergy").setAttribute("src", iconEnergy);
	document.getElementById("iconScore").setAttribute("src", iconScore);

	/* const colonSpan = document.getElementById("gameTimeColon") as HTMLSpanElement;

	setInterval(() => {
		colonSpan.style.visibility = colonSpan.style.visibility === "hidden" ? "visible" : "hidden";
	}, 1000); */
}
