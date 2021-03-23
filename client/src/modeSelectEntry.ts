import "css/index.css"
import * as Cookies from "js-cookie";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import MenuManager from "ts/ui/MenuManager";

window.onload = () => {
	const map = L.map("map", {
		center: [56.504754, 21.010924], // Liepaaja be like: [56.50475439537235, 21.010924221837993]
		zoom: 13,
		zoomControl: false,
		scrollWheelZoom: false,
		dragging: false,
		// minZoom: 13,
		maxBounds: L.latLngBounds(
			L.latLng(56.47, 20.95),
			L.latLng(56.56, 21.1)
		)
	});

	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
	}).addTo(map);

	document.getElementById("btnSP").addEventListener("click", () => {
		window.location.href = `/game?mode=sp`;
	});

	// tslint:disable-next-line: no-unused-expression
	new MenuManager(document.getElementById("mainContainer"), "modeSelect");

	// Load username from cookies

	const usernameCookie = Cookies.get("username");
	const usernameInput = document.getElementById("mpUsernameInput") as HTMLInputElement;

	if(usernameCookie){
		usernameInput.value = usernameCookie;
	}

	document.getElementById("btnCreateLobby").addEventListener("click", () => {
		Cookies.set("username", usernameInput.value);
		window.location.href = "/createLobby";
	});

	document.getElementById("mpJoinLobbyOK").addEventListener("click", () => {
		Cookies.set("username", usernameInput.value);

		// TODO: check if lobby exists beforehand

		const lobbyID = (document.getElementById("mpLobbyInput") as HTMLInputElement).value;

		window.location.href = `/join?id=${lobbyID}`;
	});
};
