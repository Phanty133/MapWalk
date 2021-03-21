import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import cumfuck from "img/cumfuck.png";
import cumfuckActive from "img/cumfuckActive.png";
import playerImg from "img/player.png";
import posMarkImg from "img/hue-zero-marker.png";
import { MapObject } from "ts/map/mapObject";
import Log from "ts/lib/log";
import Player from "ts/game/Player";
import { EventEmitter } from "events";
import createElement from "ts/lib/createElement";

export interface ObjectData {
	name: string;
	description: string;
	image: string;
	location: { lat: number, lng: number };
};

export default class Map {
	EPSILON = 0.001;

	map: L.Map;
	markers: L.Marker[] = [];
	placesOnMap: Record<string, MapObject> = {};
	currentlyActive: L.Marker = null;
	posMarker: L.Marker = null;
	player: Player = null;
	link: L.Polyline;
	lines: L.Polyline[] = [];

	selectBounds: L.LatLngBounds = L.latLngBounds(
		L.latLng(56.47, 20.95),
		L.latLng(56.56, 21.1)
	);

	events: EventEmitter = new EventEmitter();

	iconInactive = new L.Icon({
		iconUrl: cumfuck,
		iconAnchor: L.Icon.Default.prototype.options.iconAnchor
	});
	iconActive = new L.Icon({
		iconUrl: cumfuckActive,
		iconAnchor: L.Icon.Default.prototype.options.iconAnchor
	});
	iconPlayer = new L.Icon({
		iconUrl: playerImg,
		iconAnchor: L.Icon.Default.prototype.options.iconAnchor
	});

	static nonMetricDistanceTo(thisLatLng: L.LatLngExpression, otherLatLng: L.LatLngExpression) {
		const a = thisLatLng as L.LatLng;
		const b = otherLatLng as L.LatLng;
		return Math.sqrt((b.lat - a.lat) ** 2 + (b.lng - a.lng) ** 2);
	}

	constructor(id: string, objects?: ObjectData[]) {

		this.map = L.map(id, {
			center: [56.504754, 21.010924], // Liepaaja be like: [56.50475439537235, 21.010924221837993]
			zoom: 16,
			zoomControl: false,
			scrollWheelZoom: false,
			doubleClickZoom: false,
			// minZoom: 13,
			maxBounds: L.latLngBounds(
				L.latLng(56.47, 20.95),
				L.latLng(56.56, 21.1)
			)
		});

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
		}).addTo(this.map);

		L.control.scale().addTo(this.map);

		let _objects: MapObject[];

		if (objects) {
			_objects = objects.map(obj => new MapObject([obj.location.lat, obj.location.lng], obj.name, obj.description, obj.image));
		}
		else {
			_objects = [
				new MapObject([56.512922, 21.012326], null, "This is a river of cum, click if you dare.", null),
				new MapObject([56.512519, 21.028135], null, "The fish zone", null),
				new MapObject([56.5189124, 20.98500], null, "Plce 3 with no joke!!!", null)
			] // Hand defined for now
		}

		_objects.forEach(element => {
			const testMarker = L.marker(element.latLng, {
				icon: this.iconInactive
			}).addTo(this.map);

			testMarker.bindTooltip(element.name, {
				offset: new L.Point(0, -30)
			});

			testMarker.addEventListener("click", (e) => {
				this.activate(testMarker);
			});

			this.markers.push(testMarker);

			this.placesOnMap[element.name] = element;
		});
	}

	bind() {
		this.map.addEventListener("contextmenu", (e) => {
			this.clearSelection();
		});

		this.map.addEventListener("dblclick", (e) => {
			this.click(e as L.LeafletMouseEvent);
		})

		this.map.addEventListener("keydown", (e) => {
			const keyEv = e as L.LeafletKeyboardEvent;
			if (keyEv.originalEvent.key === "shift") {
				this.map.removeEventListener("contextmenu");
			}
			/*if (keyEv.originalEvent.key === "Enter") {
				this.saveSelection();
			}*/
		});

		this.map.addEventListener("keyup", (e) => {
			const keyEv = e as L.LeafletKeyboardEvent;
			if (keyEv.originalEvent.key === "shift") {
				this.map.addEventListener("contextmenu", (ee) => {
					this.clearSelection();
				});
			}
		});

		this.player.events.on("MoveDone", () => {
			this.moveDone();
		});

		document.getElementById("makeMove")!.addEventListener("click", () => {
			this.saveSelection();
		});
	}

	/*activate(marker: L.Marker) {
		if (this.currentlyActive.includes(marker)) {
			if (this.currentlyActive.length > 0) {
				this.currentlyActive[0].setIcon(this.iconInactive);
				this.currentlyActive.shift();
			}
			return;
		}
		if (this.currentlyActive.length > 0) {
			// Log.log(this.lines);
			let find = false;
			this.lines.forEach(line => {
				const latLngs: L.LatLng[] = line.getLatLngs() as L.LatLng[];
				// Log.log(latLngs);
				if ((this.currentlyActive[0].getLatLng().equals(latLngs[0]) || this.currentlyActive[0].getLatLng().equals(latLngs[1]))
					&& (marker.getLatLng().equals(latLngs[0]) || marker.getLatLng().equals(latLngs[1]))) {
					find = true;
				}
			});
			if (find)
				return;
		}
		if (this.currentlyActive.length === 2) {
			this.currentlyActive[0].setIcon(this.iconInactive);
			this.currentlyActive.shift();
		}
		marker.setIcon(this.iconActive);
		this.currentlyActive.push(marker);
		if (this.currentlyActive.length === 2) {
			if (this.link) {
				this.link.remove();
			}
			this.link = new L.Polyline([this.currentlyActive[0].getLatLng(), this.currentlyActive[1].getLatLng()], {
				color: "red"
			}).addTo(this.map);
		}
	}*/

	activate(marker: L.Marker) {
		if (this.currentlyActive) {
			this.currentlyActive.setIcon(this.iconInactive);
		}
		if (this.posMarker) {
			this.posMarker.remove();
			this.posMarker = null;
		}

		this.currentlyActive = marker;
		this.currentlyActive.setIcon(this.iconActive);

		if (this.link) {
			this.link.remove();
		}

		this.player.traceRoute(marker.getLatLng(), (route: L.Routing.IRoute) => {
			/*this.link = new L.Polyline(route.coordinates, {
				color: "red"
			}).addTo(this.map);*/
		});

		if (Map.nonMetricDistanceTo(this.currentlyActive.getLatLng(), this.player.marker.getLatLng()) < this.EPSILON) {
			this.popOpenQuestion();
		}
	}

	click(ev: L.LeafletMouseEvent) {
		if (!this.selectBounds.contains(ev.latlng)) return;
		if (ev.originalEvent.button !== 0) return;
		if (this.currentlyActive != null) {
			this.currentlyActive.setIcon(this.iconInactive);
			this.currentlyActive = null;
		}
		if (this.posMarker) {
			this.posMarker.remove();
			this.posMarker = null;
		}
		this.popClosedQuestion();

		const tempIco = new L.Icon({
			iconUrl: posMarkImg,
			iconAnchor: L.Icon.Default.prototype.options.iconAnchor
		});

		this.posMarker = L.marker(ev.latlng, {
			icon: tempIco
		}).addTo(this.map);

		if (this.link) {
			this.link.remove();
		}

		this.player.traceRoute(ev.latlng, (route: L.Routing.IRoute) => {
			// Log.log(route);
			/*this.link = new L.Polyline(route.coordinates, {
				color: "red"
			}).addTo(this.map);*/
		});
	}

	clearSelection() {
		if (this.posMarker) {
			this.posMarker.remove();
			this.posMarker = null;
		}
		if (this.link) {
			this.link.remove();
		}
		if (this.currentlyActive) {
			this.currentlyActive.setIcon(this.iconInactive);
			this.currentlyActive = null;
		}
		this.player.killRoute();
		this.popClosedQuestion();
	}

	saveSelection() {
		/*if(this.saved == null) {
			this.saved = this.currentlyActive;
		}
		this.lines.push(this.link);
		this.link = null;
		this.clearSelection();*/
		if (this.player.moving) return;
		if (this.posMarker) {
			this.events.emit("MarkerActivated", this.posMarker);
			this.posMarker.remove();
			this.posMarker = null;
			this.popClosedQuestion();
		}
		if (!this.currentlyActive) return;
		// Log.log("ohoto i ribalka");
		this.events.emit("MarkerActivated", this.currentlyActive);
		this.popClosedQuestion();
	}

	moveDone() {
		if (!this.currentlyActive) return;

		if (Map.nonMetricDistanceTo(this.currentlyActive.getLatLng(), this.player.marker.getLatLng()) < this.EPSILON) {
			this.popOpenQuestion();
		}
	}

	popOpenQuestion() {
		if (!this.player.hasTurn()) return;
		document.getElementById("qotd")!.innerHTML = ""; // fuck children
		document.getElementById("qotd")!.hidden = false;
		const bruh = createElement("p", {
			class: "thatThingInsideTheQuestionBoxShouldBeLeftIgnoredTbh"
		}) as HTMLElement;
		const place = this.placesOnMap[this.currentlyActive.getTooltip().getContent().toString()];
		// Log.log(place);
		bruh.innerHTML = `
		<b>${place.name}</b>
		<br/>
		${place.description}
		<br/>
		<div id="questionImageContainer">
			<img src="${place.image}" alt="fuck you"/>
		</div>`; // + this;
		document.getElementById("qotd")!.append(bruh);
	}

	popClosedQuestion() {
		document.getElementById("qotd")!.hidden = true;
	}
}
