import Game from "ts/game/Game";
import Chat from "./Chat";

export function bindGameUI(game: Game){
	document.getElementById("playerRest").addEventListener("click", () => {
		game.localPlayer.rest()
	});

	document.getElementById("playerMove").addEventListener("click", () => {
		game.map.saveSelection();
	});

	new Chat();
}
