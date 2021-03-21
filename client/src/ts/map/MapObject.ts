import * as L from "leaflet";
import cumfuck from "img/cumfuck.png";
import cumfuckActive from "img/cumfuckActive.png";
import Map from "./map";
import Game from "ts/game/Game";
import MathExtras from "ts/lib/MathExtras";
import Log from "ts/lib/log";

export interface MapObjectData {
	name: string;
	description: string;
	image: string;
	location: L.LatLng;
};

export default class MapObject {
	data: MapObjectData;
	private marker: L.Marker;
	private game: Game;
	private map: Map;
	private active: boolean = false;

	public get pos(){
		return this.data.location;
	}

	private iconInactive: L.Icon = new L.Icon({
		iconUrl: cumfuck,
		iconAnchor: L.Icon.Default.prototype.options.iconAnchor
	});

	private iconActive: L.Icon = new L.Icon({
		iconUrl: cumfuckActive,
		iconAnchor: L.Icon.Default.prototype.options.iconAnchor
	});

	constructor(game: Game, data: MapObjectData) {
		this.data = data;
		this.game = game;
		this.map = game.map;

		this.initMarker();
	}

	private initMarker(){
		this.marker = L.marker(this.data.location, { icon: this.iconInactive }).addTo(this.map.map);

		this.marker.bindTooltip(this.data.name, { offset: new L.Point(0, -30) });
		this.marker.addEventListener("click", e => { this.toggleState(); });
	}

	private showMarker(){
		this.marker.addTo(this.map.map);
	}

	toggleState(deactivate = false){ // The argument determines whether the marker should be forcefully deactivated (no matter the current state)
		if(this.active || deactivate) {
			this.marker.setIcon(this.iconInactive);
			this.map.activeObject = null;
			return;
		}

		this.map.cancelCurrentOrder();

		this.map.activeObject = this;
		this.map.onMarkerActivate();

		this.marker.setIcon(this.iconActive);

		if(Map.nonMetricDistanceTo(this.marker.getLatLng(), this.game.localPlayer.pos) < MathExtras.EPSILON){
			Log.log("popper open");
		}
	}
}
