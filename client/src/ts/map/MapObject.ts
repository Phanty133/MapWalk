import * as L from "leaflet";
import objectUnansweredSVG from "img/MarkerObjectUnanswered.svg";
import objectAnsweredSVG from "img/MarkerObjectAnswered.svg";
import GameMap from "./GameMap";
import Game from "ts/game/Game";
import MathExtras from "ts/lib/MathExtras";
import Log from "ts/lib/log";
import Time from "ts/game/Time";
import { SVGIcon } from "ts/lib/svg-icon/SVGIcon";
import { Color } from "ts/lib/Color";

export interface MapObjectData {
	name: string;
	description: string;
	image: string;
	location: L.LatLng;
	questions: string[];
	id: number;
	answered?: boolean;
};

export enum MapObjectState{
	Default,
	Active,
	Highlighted
};

export default class MapObject {
	static colorUnanswered = "#D3BF0E";
	static colorAnswered = "#11D30E";

	data: MapObjectData;
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
		return this.data.answered ? this.data.answered : false;
	}

	public set answered(ans: boolean) {
		this.data.answered = ans;
	}

	public get pos() {
		return this.data.location;
	}

	public get id(): number {
		return this.data.id;
	}

	private iconUnanswered: SVGIcon;
	private iconAnswered: SVGIcon;

	constructor(game: Game, data: MapObjectData) {
		this.data = data;
		this.game = game;
		this.map = game.map;

		this.iconUnanswered = new SVGIcon({
			iconAnchor: L.Icon.Default.prototype.options.iconAnchor,
			svgLink: objectUnansweredSVG,
			color: MapObject.colorUnanswered
		});

		this.iconAnswered = new SVGIcon({
			iconAnchor: L.Icon.Default.prototype.options.iconAnchor,
			svgLink: objectAnsweredSVG,
			color: MapObject.colorAnswered
		});

		this.state = MapObjectState.Default;
		this.answered = data.answered ? data.answered : false;

		this.initMarker();
		Time.bindToFrame(() => { this.onFrame() });
	}

	private initMarker() {
		this.marker = L.marker(this.pos, { icon: this.answered ? this.iconAnswered : this.iconUnanswered });
		this.marker.setOpacity(0);

		this.marker.bindTooltip(this.data.name, { offset: new L.Point(0, -30) });
		this.marker.addEventListener("click", e => { this.toggleState(); });

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

		for (const plyr of this.game.players) {
			if (!plyr.moving) continue;
			if ((plyr.isLocalPlayer && this.visible) || plyr.info.visibleMarkers.includes(this.id)) continue;

			if (plyr.isPosVisible(this.pos)) {
				if (plyr.isLocalPlayer) this.showMarker();
				plyr.info.visibleMarkers.push(this.id);
			}
		}

		if (!this.game.localPlayer.moving) return;

		if (this.game.localPlayer.isPosVisible(this.pos)) {
			this.showMarker();
		}
	}

	setState(newState: MapObjectState){
		this.state = newState;
		const activeIcon = this.answered ? this.iconAnswered : this.iconUnanswered;

		switch(this.state){
			case MapObjectState.Default:
				if(this.answered){
					this.iconAnswered.setColor(Color.hexToRGB(MapObject.colorAnswered))
				}
				else{
					this.iconUnanswered.setColor(Color.hexToRGB(MapObject.colorUnanswered))
				}
				break;
			case MapObjectState.Active:
				activeIcon.setColor(Color.hexToRGB("#FF0000"));
				break;
			case MapObjectState.Highlighted:
				activeIcon.setColor(Color.hexToRGB("#0000FF"));
				break;
		}
	}

	toggleState(deactivate = false) { // The argument determines whether the marker should be forcefully deactivated (no matter the current state)
		if (this.active || deactivate) {
			// this.marker.setIcon(this.answered ? this.iconAnswered : this.iconUnanswered);
			this.setState(MapObjectState.Active);
			this.map.activeObject = null;
			return;
		}

		this.map.cancelCurrentOrder();

		this.map.activeObject = this;
		this.map.onMarkerActivate();

		// this.marker.setIcon(this.iconActive);

		if (GameMap.nonMetricDistanceTo(this.pos, this.game.localPlayer.pos) < MathExtras.EPSILON) {
			this.map.popOpenQuestion();
		}
	}

	onCorrectAnswer(origin?: string) {
		if (this.answered) return;

		this.answered = true;
		this.marker.setIcon(this.iconAnswered);

		if (origin) {
			this.game.playersByID[origin].incrementScore();
		}
		else {
			this.game.localPlayer.incrementScore();
		}
	}

	onIncorrectAnswer(origin?: string) {
		if (this.answered) return;

		Log.log("u stupid");

		if (!this.game.isMultiplayer) {
			this.game.clock.addTime(this.timeLossOnIncorrectAnswer);
		}
	}

	remove() {
		this.map.map.removeLayer(this.marker);
		this.visible = false;
		this.active = false;
	}
}
