import Game from "ts/game/Game";

export function bindGameUI(game: Game){
	document.getElementById("playerRest").addEventListener("click", () => {
		game.localPlayer.rest()
	});

	document.getElementById("playerMove").addEventListener("click", () => {
		game.map.saveSelection();
	});
}
