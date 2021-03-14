import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import cumfuck from "img/cumfuck.png";
import cumfuckActive from "img/cumfuckActive.png";
import { MapObject } from "ts/mapObject";

export class Map {
	map: L.Map;
	markers: L.Marker[] = [];
	currentlyActive: L.Marker[] = [];

	iconInactive = new L.Icon({
		iconUrl: cumfuck,
		iconAnchor: L.Icon.Default.prototype.options.iconAnchor
	});
	iconActive = new L.Icon({
		iconUrl: cumfuckActive,
		iconAnchor: L.Icon.Default.prototype.options.iconAnchor
	});

	nonMetricDistanceTo(thisLatLng: L.LatLngExpression, otherLatLng: L.LatLngExpression) {
		const a = otherLatLng as L.LatLng;
		const b = otherLatLng as L.LatLng;
		return Math.sqrt((a.lat - b.lat) ** 2 + (a.lng - b.lng) ** 2);
	}

	constructor(id: string) {

		this.map = L.map(id, {
			center: [56.50475439537235, 21.010924221837993], // Liepaaja be like: [56.50475439537235, 21.010924221837993]
			zoom: 15,
			minZoom: 13,
			maxBounds: L.latLngBounds(
				L.latLng(56.46671450384127, 20.942759323837972),
				L.latLng(56.56357049044075, 21.106128222201132)
			)
		});

		this.map.addEventListener("contextmenu", (e) => {
			this.clearSelection();
		});

		this.map.addEventListener("keydown", (e) => {
			const keyEv = e as L.LeafletKeyboardEvent;
			if (keyEv.originalEvent.key === "shift") {
				this.map.removeEventListener("contextmenu");
			}
		});

		this.map.addEventListener("keyup", (e) => {
			const keyEv = e as L.LeafletKeyboardEvent;
			if (keyEv.originalEvent.key === "shift") {
				this.map.addEventListener("contextmenu", (ee) => {
					this.clearSelection();
				});
			}
		});

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
		}).addTo(this.map);

		L.control.scale().addTo(this.map);

		const objects = [
			new MapObject([56.51292213894928, 21.012326233692708], "This is a river of cum, click if you dare."),
			new MapObject([56.51251995960712, 21.028135815168024], "The fish zone"),
			new MapObject([56.518912681668304, 20.98500589524165], "Plce 3 with no joke!!!")
		] // Hand defined for now

		objects.forEach(element => {
			const testMarker = L.marker(element.latLng, {
				icon: this.iconInactive
			}).addTo(this.map);

			testMarker.bindTooltip(element.description, {
				offset: new L.Point(0, -30)
			});

			testMarker.addEventListener("click", (e) => {
				this.activate(testMarker);
			});

			this.markers.push(testMarker);
		});
	}

	activate(marker: L.Marker) {
		if (this.currentlyActive.includes(marker)) {
			if (this.currentlyActive.length > 1) {
				this.currentlyActive[0].setIcon(this.iconInactive);
				this.currentlyActive.shift();
			}
			return;
		}
		if (this.currentlyActive.length === 2) {
			this.currentlyActive[0].setIcon(this.iconInactive);
			this.currentlyActive.shift();
		}
		marker.setIcon(this.iconActive);
		this.currentlyActive.push(marker);
	}

	clearSelection() {
		this.currentlyActive.forEach(marker => {
			marker.setIcon(this.iconInactive);
		});
		this.currentlyActive = [];
	}
}
