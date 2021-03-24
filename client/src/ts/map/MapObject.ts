import * as L from "leaflet";
import cumfuck from "img/cumfuck.png";
import cumfuckActive from "img/cumfuckActive.png";
import objectAnswered from "img/objectAnswered.png";
import GameMap from "./GameMap";
import Game from "ts/game/Game";
import MathExtras from "ts/lib/MathExtras";
import Log from "ts/lib/log";
import Time from "ts/game/Time";

export interface MapObjectData {
	name: string;
	description: string;
	image: string;
	location: L.LatLng;
	questions: string[];
	id: number;
};

export default class MapObject {
	data: MapObjectData;
	private marker: L.Marker;
	private game: Game;
	private map: GameMap;
	private active: boolean = false;
	private visible: boolean = false;
	private fadeIn: boolean = false;
	private fadeInTimeSinceStart: number = 0; // ms since fade started
	private timeLossOnIncorrectAnswer: number = 1;
	private answered: boolean = false;
	private fadeInTime = 500; // In ms

	public get pos() {
		return this.data.location;
	}

	public get id(): number{
		return this.data.id;
	}

	private iconInactive: L.Icon = new L.Icon({
		iconUrl: cumfuck,
		iconAnchor: L.Icon.Default.prototype.options.iconAnchor
	});

	private iconActive: L.Icon = new L.Icon({
		iconUrl: cumfuckActive,
		iconAnchor: L.Icon.Default.prototype.options.iconAnchor
	});

	private iconAnswered: L.Icon = new L.Icon({
		iconUrl: objectAnswered,
		iconAnchor: L.Icon.Default.prototype.options.iconAnchor
	});

	constructor(game: Game, data: MapObjectData) {
		this.data = data;
		this.game = game;
		this.map = game.map;

		this.initMarker();
		Time.bindToFrame(() => { this.onFrame() });
	}

	private initMarker() {
		this.marker = L.marker(this.pos, { icon: this.iconInactive });
		this.marker.setOpacity(0);

		this.marker.bindTooltip(this.data.name, { offset: new L.Point(0, -30) });
		this.marker.addEventListener("click", e => { this.toggleState(); });

		if(GameMap.nonMetricDistanceTo(this.pos, this.game.localPlayer.pos) <= this.game.localPlayer.stats.visibility){
			this.showMarker();
		}
	}

	private showMarker() {
		this.marker.addTo(this.map.map);
		this.visible = true;
		this.fadeIn = true;
	}

	private onFrame() {
		// Check if the player is in visibility range of the marker
		// TODO: make it a tad more efficient

		if (this.fadeIn) {
			if (this.fadeInTimeSinceStart >= this.fadeInTime) {
				this.fadeIn = false;
				this.fadeInTimeSinceStart = 0;
			}
			else {
				this.marker.setOpacity(this.fadeInTimeSinceStart / this.fadeInTime);
				this.fadeInTimeSinceStart += Time.deltaTime;
			}
		}

		if (this.visible) return;
		if (!this.game.localPlayer.moving) return;

		if(this.game.localPlayer.isPosVisible(this.pos)){
			this.showMarker();
		}
	}

	toggleState(deactivate = false) { // The argument determines whether the marker should be forcefully deactivated (no matter the current state)
		if (this.active || deactivate) {
			this.marker.setIcon(this.answered ? this.iconAnswered : this.iconInactive);
			this.map.activeObject = null;
			return;
		}

		this.map.cancelCurrentOrder();

		this.map.activeObject = this;
		this.map.onMarkerActivate();

		this.marker.setIcon(this.iconActive);

		if(GameMap.nonMetricDistanceTo(this.pos, this.game.localPlayer.pos) < MathExtras.EPSILON){
			this.map.popOpenQuestion();
		}
	}

	onCorrectAnswer(origin?: string) {
		if (this.answered) return;

		this.answered = true;
		this.marker.setIcon(this.iconAnswered);

		if(origin){
			this.game.playersByID[origin].incrementScore();
		}
		else{
			this.game.localPlayer.incrementScore();
		}
	}

	onIncorrectAnswer(origin?: string) {
		if (this.answered) return;

		Log.log("u stupid");

		if(!this.game.isMultiplayer){
			this.game.clock.addTime(this.timeLossOnIncorrectAnswer);
		}
	}
}
