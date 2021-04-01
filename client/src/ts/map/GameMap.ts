import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import MarkerMoveTarget from "img/MarkerMoveTarget.svg";
import MapObject, { MapObjectData, MapObjectState } from "ts/map/MapObject";
import { EventEmitter } from "events";
import createElement from "ts/lib/createElement";
import Game, { GameState } from "ts/game/Game";
import { randInt } from "ts/lib/util";
import Log from "ts/lib/log";
import { SVGIcon } from "ts/lib/svg-icon/SVGIcon";
import { Color } from "ts/lib/Color";
import RestObject, { RestObjectData } from "./RestObject";
import fxClick from "audio/click.wav";

export default class GameMap {
	EPSILON = 0.001;

	map: L.Map;
	game: Game;
	currentlyActive: L.Marker = null;
	posMarker: L.Marker = null;
	link: L.Polyline;

	activeObject: MapObject | RestObject = null;
	objectsByID: Record<number, MapObject | RestObject> = {};
	restObjs: RestObject[] = [];
	private _objectsHighlighted = false;
	private infoPopup: L.Popup = null;

	public get objectsHighlighted() {
		return this._objectsHighlighted;
	}

	private posMarkerIcon: SVGIcon = new SVGIcon({
		iconAnchor: [16, 16],
		iconSize: new L.Point(32, 32),
		svgLink: MarkerMoveTarget,
		color: Color.hexToRGB("#11d30e")
	});

	selectBounds: L.LatLngBounds = L.latLngBounds(
		L.latLng(56.47, 20.95),
		L.latLng(56.56, 21.1)
	);

	events: EventEmitter = new EventEmitter();

	static nonMetricDistanceTo(thisLatLng: L.LatLngExpression, otherLatLng: L.LatLngExpression) {
		const a = thisLatLng as L.LatLng;
		const b = otherLatLng as L.LatLng;

		const scaledLatA = a.lat ** 1.1;
		const scaledLatB = b.lat ** 1.1;

		return Math.sqrt((scaledLatB - scaledLatA) ** 2 + (b.lng - a.lng) ** 2);
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

	clearObjects() {
		this.clearSelection();

		for (const objIDStr of Object.keys(this.objectsByID)) {
			const id = parseInt(objIDStr, 10);
			this.objectsByID[id].remove();
			delete this.objectsByID[id];
		}

		this.objectsByID = {}; // Redundant?
	}

	createObjects(_objects?: MapObjectData[]) {
		let objects = _objects;

		if (!_objects) {
			objects = [{
				name: "This is a river of cum, click if you dare.",
				location: new L.LatLng(56.512922, 21.012326),
				image: null,
				description: null,
				questions: ["you"],
				id: 0
			},
			{
				name: "The fish zone",
				location: new L.LatLng(56.512519, 21.028135),
				image: null,
				description: null,
				questions: ["you"],
				id: 1
			},
			{
				name: "Plce 3 with no joke!!!",
				location: new L.LatLng(56.5189124, 20.98500),
				image: null,
				description: null,
				questions: [""],
				id: 2
			}
			]
		}

		for (const obj of objects) {
			const mapObj = new MapObject(this.game, obj);
			this.objectsByID[mapObj.id] = mapObj;
		}
	}

	createRestObjects(_objects?: RestObjectData[]) {
		let objects = _objects;

		if (!_objects) {
			objects = [{
				name: "This is a river of cum, click if you dare.",
				location: new L.LatLng(56.512922, 21.012326),
				image: null,
				id: 0,
				questions: []
			},
			{
				name: "The fish zone",
				location: new L.LatLng(56.512519, 21.028135),
				image: null,
				id: 1,
				questions: []
			},
			{
				name: "Plce 3 with no joke!!!",
				location: new L.LatLng(56.5189124, 20.98500),
				image: null,
				id: 2,
				questions: []
			}
			]
		}

		for (const obj of objects) {
			const mapObj = new RestObject(this.game, obj);
			this.restObjs.push(mapObj);
			this.objectsByID[mapObj.id] = mapObj;
		}
	}

	bindMapEvents() {
		this.map.addEventListener("contextmenu", (e) => {
			this.clearSelection();
		});

		this.map.addEventListener("dblclick", (e) => {
			this.game.soundEngine.playEffect(fxClick);
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

	onMarkerActivate() {
		this.game.localPlayer.traceRoute(this.activeObject.pos);
	}

	cancelCurrentOrder(clearMarker = true) {
		if (this.activeObject && clearMarker) {
			this.activeObject.setState(MapObjectState.Default);
			this.activeObject = null;
		}

		if (this.posMarker) {
			this.posMarker.remove();
			this.posMarker = null;
		}

		this.game.localPlayer.killRoute();
	}

	onDoubleClick(ev: L.LeafletMouseEvent) {
		if (!this.selectBounds.contains(ev.latlng)) return;
		if (ev.originalEvent.button !== 0) return;
		if (!this.game.localPlayer.hasTurn()) return;
		if (this.game.state !== GameState.PlayerAction && !(this.game.state === GameState.PlayerInteracting && !this.game.isMultiplayer)) return;
		if (!this.game.turnMan.activePlayer.isPosVisible(ev.latlng)) return;

		this.cancelCurrentOrder();
		this.popClosedQuestion();

		this.posMarker = L.marker(ev.latlng, {
			icon: this.posMarkerIcon
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

	highlightObjects(objects: (MapObject | RestObject)[]) {
		for (const obj of objects) {
			obj.setState(MapObjectState.Highlighted);
		}

		this._objectsHighlighted = true;

		/*	if (!this.activeObject) return;

			if (GameMap.nonMetricDistanceTo(this.activeObject.pos, this.game.localPlayer.marker.getLatLng()) < this.EPSILON) {
				this.popOpenQuestion();
			} */
	}

	unhighlightObjects(objects: (MapObject | RestObject)[]) {
		for (const obj of objects) {
			obj.setState(MapObjectState.Default);
		}

		this._objectsHighlighted = false;
	}

	popOpenQuestion() {
		if (!this.game.localPlayer.hasTurn()) return;

		if (this.activeObject.data.questions.length > 0) {
			this.game.chatBot.askQuestion(this.activeObject.data.questions[randInt(0, this.activeObject.data.questions.length)]);
		} else {
			this.game.chatBot.askQuestion("There was no question so here's a placeholder!");
		}
	}

	popClosedQuestion() {
		this.game.chatBot.invalidateQuestion();
	}

	openObjectInfo(mapObj: MapObject) {
		if (this.infoPopup) {
			this.infoPopup.remove();
		}

		this.infoPopup = L.popup().setLatLng(mapObj.pos);

		const lazyHTMLTemplate = `
			<span data-title>${mapObj.data.name}</span>
			<div id="questionImageContainer">
				<img src="${this.activeObject.data.image}" alt="no support no respect"/>
			</div>
			<span data-desc>${mapObj.data.description}</span>
		`;

		const containerEl = createElement("div", { class: "objectInfoContainer" });
		containerEl.innerHTML = lazyHTMLTemplate;

		this.infoPopup.setContent(containerEl).openOn(this.map);
	}

	closeObjectInfo() {
		if (!this.infoPopup) return;

		this.infoPopup.remove();
		this.infoPopup = null;
	}

	toggleObjectInfo(obj: MapObject) {
		if (this.infoPopup) {
			this.closeObjectInfo();
		}
		else {
			this.openObjectInfo(obj);
		}
	}

	countAnsweredObjects(): number {
		return Object.values(this.objectsByID).filter(obj => obj.answered).length;
	}
}
