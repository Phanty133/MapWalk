import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import posMarkImg from "img/hue-zero-marker.png";
import MapObject, { MapObjectData } from "ts/map/MapObject";
import { EventEmitter } from "events";
import createElement from "ts/lib/createElement";
import Game from "ts/game/Game";
import { randInt } from "ts/lib/util";

export default class Map {
	EPSILON = 0.001;

	map: L.Map;
	game: Game;
	currentlyActive: L.Marker = null;
	posMarker: L.Marker = null;
	link: L.Polyline;

	activeObject: MapObject = null;

	selectBounds: L.LatLngBounds = L.latLngBounds(
		L.latLng(56.47, 20.95),
		L.latLng(56.56, 21.1)
	);

	events: EventEmitter = new EventEmitter();

	static nonMetricDistanceTo(thisLatLng: L.LatLngExpression, otherLatLng: L.LatLngExpression) {
		const a = thisLatLng as L.LatLng;
		const b = otherLatLng as L.LatLng;
		return Math.sqrt((b.lat - a.lat) ** 2 + (b.lng - a.lng) ** 2);
	}

	constructor(id: string, game: Game) {
		this.game = game;

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
	}

	createObjects(_objects?: MapObjectData[]) {
		let objects = _objects;

		if (!_objects) {
			objects = [{
				name: "This is a river of cum, click if you dare.",
				location: new L.LatLng(56.512922, 21.012326),
				image: null,
				description: null,
				questions: ["you"]
			},
			{
				name: "The fish zone",
				location: new L.LatLng(56.512519, 21.028135),
				image: null,
				description: null,
				questions: ["you"]
			},
			{
				name: "Plce 3 with no joke!!!",
				location: new L.LatLng(56.5189124, 20.98500),
				image: null,
				description: null,
				questions: ["you"]
			}
			]
		}

		objects.map(obj => new MapObject(this.game, obj));
	}

	bindMapEvents() {
		this.map.addEventListener("contextmenu", (e) => {
			this.clearSelection();
		});

		this.map.addEventListener("dblclick", (e) => {
			this.onDoubleClick(e as L.LeafletMouseEvent);
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

	onMarkerActivate() {
		this.game.localPlayer.traceRoute(this.activeObject.pos);
	}

	cancelCurrentOrder(clearMarker = true) {
		if (this.activeObject && clearMarker) {
			this.activeObject.toggleState(true);
		}

		if (this.posMarker) {
			this.posMarker.remove();
			this.posMarker = null;
		}

		if (this.link) {
			this.link.remove();
			this.link = null;
		}
	}

	onDoubleClick(ev: L.LeafletMouseEvent) {
		if (!this.selectBounds.contains(ev.latlng)) return;
		if (ev.originalEvent.button !== 0) return;

		this.cancelCurrentOrder();

		this.popClosedQuestion();

		const tempIcon = new L.Icon({
			iconUrl: posMarkImg,
			iconAnchor: L.Icon.Default.prototype.options.iconAnchor
		});

		this.posMarker = L.marker(ev.latlng, {
			icon: tempIcon
		}).addTo(this.map);

		this.game.localPlayer.traceRoute(ev.latlng);
	}

	clearSelection() {
		this.cancelCurrentOrder(true);
		this.game.localPlayer.killRoute();
		this.popClosedQuestion();
	}

	saveSelection() {
		if (this.game.localPlayer.moving) return;

		if (this.posMarker) {
			this.events.emit("MarkerActivated", this.posMarker.getLatLng());

			this.posMarker.remove();
			this.posMarker = null;

			this.popClosedQuestion();

			return;
		}

		if (!this.activeObject) return;

		this.events.emit("MarkerActivated", this.activeObject.pos);
		this.popClosedQuestion();
	}

	moveDone() {
		if (!this.activeObject) return;

		if (Map.nonMetricDistanceTo(this.activeObject.pos, this.game.localPlayer.marker.getLatLng()) < this.EPSILON) {
			this.popOpenQuestion();
		}
	}

	popOpenQuestion() {
		if (!this.game.localPlayer.hasTurn()) return;

		document.getElementById("qotd")!.innerHTML = ""; // fuck children
		document.getElementById("qotd")!.hidden = false;

		const bruh = createElement("p", {
			class: "thatThingInsideTheQuestionBoxShouldBeLeftIgnoredTbh"
		}) as HTMLElement;

		// Log.log(place);
		bruh.innerHTML = `
			<b>${this.activeObject.data.name}</b>
			<br/>
			${this.activeObject.data.description}
			<br/>
			<div id="questionImageContainer">
				<img src="${this.activeObject.data.image}" alt="fuck you"/>
			</div>
			<div id="objAnswerBtnContainer"></div>
		`; // + this;

		document.getElementById("qotd")!.append(bruh);

		const btnContainer = document.getElementById("objAnswerBtnContainer");

		/*createElement("button", {
			textContent: "Answer question correctly",
			parent: btnContainer,
			events: {
				click: () => {
					this.activeObject.onCorrectAnswer();
				}
			}
		});

		createElement("button", {
			textContent: "Answer question incorrectly like a dipshit",
			parent: btnContainer,
			events: {
				click: () => {
					this.activeObject.onIncorrectAnswer();
				}
			}
		});*/

		if (this.activeObject.data.questions.length > 0) {
			this.game.chatBot.askQuestion(this.activeObject.data.questions[randInt(0, this.activeObject.data.questions.length)]);
		} else {
			this.game.chatBot.askQuestion("There was no question so here's a placeholder!");
		}
	}

	popClosedQuestion() {
		document.getElementById("qotd")!.hidden = true;

		this.game.chatBot.invalidateQuestion();
	}
}
