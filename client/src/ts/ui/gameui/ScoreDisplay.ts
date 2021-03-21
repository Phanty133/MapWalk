import Player from "ts/game/Player";

export default class ScoreDisplay{
	private el: HTMLSpanElement;
	private player: Player;

	constructor(energyEl: HTMLSpanElement, player: Player){
		this.el = energyEl;
		this.player = player;
	}

	update(){
		this.el.textContent = this.player.stats.score.toString();
	}
}
