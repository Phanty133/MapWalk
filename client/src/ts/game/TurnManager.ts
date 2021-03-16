import Player from "./Player";

export default class TurnManager{
	// Used only in MP
	activeIndex: number;
	playerOrder: Player[];

	public get activePlayer(){
		return this.playerOrder[this.activeIndex];
	}

	constructor(){
		this.activeIndex = 0;
		this.playerOrder = [];
	}

	next(){
		this.activeIndex++;
	}
}