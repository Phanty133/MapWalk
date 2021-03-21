import Player from "ts/game/Player";

export default class EnergyDisplay{
	private el: HTMLSpanElement;
	private player: Player;

	constructor(energyEl: HTMLSpanElement, player: Player){
		this.el = energyEl;
		this.player = player;
	}

	updateEnergy(){
		this.el.textContent = this.player.stats.energy.toString();
	}
}
