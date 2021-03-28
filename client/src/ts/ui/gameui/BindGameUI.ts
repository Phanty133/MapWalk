import Game from "ts/game/Game";
import Chat from "./Chat";
import ChatBotUI from "./ChatBotUI";
import GameEndUI from "./GameEndUI";
import { SkipButton } from "./SkipButton";

export function bindGameUI(game: Game){
	document.getElementById("playerRest").addEventListener("click", () => {
		game.localPlayer.rest()
	});

	document.getElementById("playerMove").addEventListener("click", () => {
		game.map.saveSelection();
	});

	new SkipButton(game);
	new Chat(game);
	game.gameEndUI = new GameEndUI(game);
}
