import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "css/index.css"

document.body.onload = () => {
	let map = L.map("map", {
		center: [51.505, -0.09],
		zoom: 8
	});

	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
	}).addTo(map);

	L.control.scale().addTo(map);
};
