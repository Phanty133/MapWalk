import Game from "./Game";
import GameEvent from "./GameEvent";
import P2PGameEventHandler from "./P2PGameEventHandler";

export default function bindEventVerifiers(p2p: P2PGameEventHandler){
	p2p.eventVerifiers.PlayerMove = async (e: GameEvent, game: Game) => {
		const originPlayer = game.playersByID[e.origin];

		return originPlayer.isMoveOrderValid(e.data.targetPos);
	}

	p2p.eventVerifiers.PlayerRest = async (e: GameEvent, game: Game) => {
		return game.turnMan.doesSocketHaveTurn(e.origin);
	};

	p2p.eventVerifiers.NextTurn = async (e: GameEvent, game: Game) => {
		return game.turnMan.doesSocketHaveTurn(e.origin);
	};

	p2p.eventVerifiers.QuestionAnswer = async (e: GameEvent, game: Game) => {
		if(!game.turnMan.doesSocketHaveTurn(e.origin)) return false;

		const resp = await game.chatBot.processMessage(e.data.answer);
		return resp === e.data.response;
	};

	p2p.eventVerifiers.GameState = async (e: GameEvent, game: Game) => {
		return game.turnMan.doesSocketHaveTurn(e.origin);
	};
}
