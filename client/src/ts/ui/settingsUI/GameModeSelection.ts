import { GameMode } from "ts/game/Game";
import ValueSelection from "./ValueSelection";

export default class GameModeSelection extends ValueSelection{
	public get value(): GameMode{
		return parseInt(this.rawValue, 10) as GameMode;
	}

	constructor(containerSelector: string){
		super(containerSelector, "Gamemode", [
			{ displayName: "Time attack", value: GameMode.TimeAttack.toString() },
			{ displayName: "100%", value: GameMode.HundredPercent.toString() },
			{ displayName: "100%'o clock", value: GameMode.HundredPercentClock.toString() }
		]);
	}
}
