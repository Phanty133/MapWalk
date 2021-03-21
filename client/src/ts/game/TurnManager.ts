import Player from "./Player";

// Used only in MP
export default class TurnManager{
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
