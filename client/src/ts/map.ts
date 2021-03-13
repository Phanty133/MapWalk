import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

export class Map{
	map: L.Map

	constructor(id:string){
		this.map = L.map(id, {
			center: [51.505, -0.09],
			zoom: 8
		});
	
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
		}).addTo(this.map);
	
		L.control.scale().addTo(this.map);
	}
}
