import * as L from "leaflet";
import restObjectSVG from "img/MarkerRestaurant.svg";
import GameMap from "./GameMap";
import Game from "ts/game/Game";
import MathExtras from "ts/lib/MathExtras";
import Log from "ts/lib/log";
import Time from "ts/game/Time";
import { SVGIcon } from "ts/lib/svg-icon/SVGIcon";
import { Color } from "ts/lib/Color";
import { MapObjectState } from "ts/map/MapObject";

export interface RestObjectData {
	name: string;
	image: string;
	location: L.LatLng;
	id: number;
	questions: string[];
};

export default class RestObject {
	static color = "#FF0000";

	data: RestObjectData;
	private marker: L.Marker;
	private game: Game;
	private map: GameMap;
	private active: boolean = false;
	private visible: boolean = false;
	private fadeIn: boolean = false;
	private fadeInTimeSinceStart: number = 0; // ms since fade started
	private timeLossOnIncorrectAnswer: number = 1;
	private fadeInTime = 500; // In ms
	private state: MapObjectState;

	public get answered() {
		return false; // A rest object will never be answered.
	}

	public get pos() {
		return this.data.location;
	}

	public get id(): number {
		return this.data.id;
	}

	private icon: SVGIcon;

	constructor(game: Game, data: RestObjectData) {
		this.data = data;
		this.data.questions = [];
		this.game = game;
		this.map = game.map;

		this.icon = new SVGIcon({
			iconAnchor: L.Icon.Default.prototype.options.iconAnchor,
			svgLink: restObjectSVG,
			color: RestObject.color,
			interactable: true
		});

		this.state = MapObjectState.Default;

		this.initMarker();
		Time.bindToFrame(() => { this.onFrame() });
	}

	private initMarker() {
		this.marker = L.marker(this.pos, { icon: this.icon });
		this.marker.setOpacity(0);

		this.marker.bindTooltip(this.data.name, { offset: new L.Point(0, -30) });
		this.marker.addEventListener("click", e => { this.clickHandler(); });

		if (this.visible) this.showMarker();

		for (const plyr of this.game.players) {
			if (plyr.isPosVisible(this.pos)) {
				if (plyr.isLocalPlayer && !this.visible) this.showMarker();
				if (!plyr.info.visibleMarkers.includes(this.id)) plyr.info.visibleMarkers.push(this.id);
			}
		}
	}

	showMarker() {
		this.marker.addTo(this.map.map);
		this.visible = true;
		this.fadeIn = true;
	}

	private onFrame() {
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

		// Check if a player is in visibility range of the marker
		// TODO: make it a tad more efficient
		for (const plyr of this.game.players) {
			if (!plyr.moving) continue;
			if ((plyr.isLocalPlayer && this.visible) || plyr.info.visibleMarkers.includes(this.id)) continue;

			if (plyr.isPosVisible(this.pos)) {
				if (plyr.isLocalPlayer) this.showMarker();
				plyr.info.visibleMarkers.push(this.id);
			}
		}
	}

	setState(newState: MapObjectState) {
		this.state = newState;
		const activeIcon = this.icon;

		switch (this.state) {
			case MapObjectState.Default:
				activeIcon.setColor(RestObject.color);
				break;
			case MapObjectState.Active:
				activeIcon.setColor("#FF0000");
				break;
			case MapObjectState.Highlighted:
				activeIcon.setColor("#0000FF");
				break;
			case MapObjectState.Targeted:
				activeIcon.setColor("#00FF00");
				break;
		}
	}

	private clickHandler() {
		if (!this.game.localPlayer.hasTurn()) return;
		if (this.state === MapObjectState.Active) return;

		if (this.state !== MapObjectState.Highlighted) { // If this hasn't been selected yet, make it the new target
			if (this.state === MapObjectState.Targeted) {
				this.map.cancelCurrentOrder(); // In the if statement because cancelCurrentOrder() resets the object state
				return;
			}

			this.map.cancelCurrentOrder();

			this.map.activeObject = this;
			this.map.onMarkerActivate();
			this.setState(MapObjectState.Targeted);

			return;
		}

		// this.map.activeObject = this;
		// this.game.turnMan.activePlayer.setTired(false);
		this.game.turnMan.activePlayer.setRestaurantVisited(true);
	}

	remove() {
		this.map.map.removeLayer(this.marker);
		this.visible = false;
		this.active = false;
	}

	onCorrectAnswer() {
		throw "What the actual fuck.";
	}

	onIncorrectAnswer() {
		throw "What the actual fuck.";
	}
}
