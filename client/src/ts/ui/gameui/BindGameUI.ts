import Game from "ts/game/Game";
import ActionUI from "./ActionUI";
import Chat from "./Chat";
import ChatBotUI from "./ChatBotUI";
import GameEndUI from "./GameEndUI";
import { SkipButton } from "./SkipButton";

export function bindGameUI(game: Game){
	new ActionUI(game);
	new SkipButton(game);
	new Chat(game);
	game.gameEndUI = new GameEndUI(game);
}
