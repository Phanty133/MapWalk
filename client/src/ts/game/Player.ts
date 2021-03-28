import * as L from "leaflet";
import Log from "ts/lib/log";
import PlayerRouter from "ts/map/PlayerRouter";
import playerSVG from "img/MarkerPlayer.svg";
import "leaflet-routing-machine";
import GameMap from "ts/map/GameMap";
import Game, { GameState } from "./Game";
import Time from "./Time";
import MathExtras from "ts/lib/MathExtras";
import FogOfWar from "ts/map/FogOfWar";
import { EventEmitter } from "events";
import EnergyDisplay from "ts/ui/gameui/EnergyDisplay";
import ScoreDisplay from "ts/ui/gameui/ScoreDisplay";
import GameEvent, { MoveEventData } from "./GameEvent";
import { GameEventData } from "./GameEventHandler";
import { PlayerData } from "ts/networking/Socket";
import { SVGIcon } from "ts/lib/svg-icon/SVGIcon";
import { Color } from "ts/lib/Color";
import MapObject from "ts/map/MapObject";

type TracingCallback = (route: L.Routing.IRoute) => void;

export interface PlayerStats {
	energy: number;
	maxEnergy: number;
	score: number;
	visibility: number;
	walkedDistance: number;
}

export interface PlayerInfo {
	pos: L.LatLng;
	restTime: number;
	timeToVisibilityEnd: number;
	speed: number;
	active: boolean;
	moving: boolean;
	metersPerEnergyUnit: number;
	socketID: string;
	hasPerformedAction: boolean;
	plyrData: PlayerData;
	visibleMarkers: number[];
	metersToVisibilityEnd: number;
	markerInteractionRange: number;
}

export default class Player {
	private router: PlayerRouter;
	private map: GameMap;
	private game: Game;
	private icon: SVGIcon;
	private initialMovePos: L.LatLng;
	private distanceToTarget: number;
	private moveFractionPerSecond: number;
	private moveInterpolater: number;
	private moveQueue: L.LatLng[] = [];
	private energyDisplay: EnergyDisplay;
	private scoreDisplay: ScoreDisplay;
	private targetPos: L.LatLng;
	private activeRoute: L.Routing.IRoute;
	private nearbyObjects: MapObject[] = null;

	isLocalPlayer: boolean = true;
	marker: L.Marker;
	stats: PlayerStats;
	info: PlayerInfo;
	fow: FogOfWar;

	events: EventEmitter = new EventEmitter();

	public get pos() {
		return this.info.pos;
	}

	public set pos(p: L.LatLng) {
		this.info.pos = p;
	}

	public get speed() {
		return this.info.speed;
	}

	public get moving() {
		return this.info.moving;
	}

	public set moving(moving: boolean) {
		this.info.moving = moving;
	}

	public get metersPerEnergyUnit() {
		return this.info.metersPerEnergyUnit;
	}

	constructor(map: GameMap, game: Game, startingPos?: L.LatLng, socket?: string, plyrData?: PlayerData) {
		this.map = map;
		this.game = game;

		this.stats = {
			energy: 10100000,
			maxEnergy: 10100000,
			score: 0,
			visibility: 0.005, // The radius of visible area in coord units
			walkedDistance: 0
		};

		this.info = {
			timeToVisibilityEnd: 10, // Time to reach the end of the visibility radius in minutes
			restTime: 10,
			pos: startingPos,
			speed: 0.005, // Units/sec
			active: false, // Whether the player can perform an action
			moving: false,
			metersPerEnergyUnit: 10,
			socketID: socket,
			hasPerformedAction: false, // Whether the player has performed an action during the current turn
			plyrData,
			visibleMarkers: [],
			metersToVisibilityEnd: startingPos.distanceTo(new L.LatLng(startingPos.lat + this.stats.visibility, startingPos.lng)),
			markerInteractionRange: 0.001
		};

		this.isLocalPlayer = socket === this.game.socket.id || socket === undefined;

		// Lame
		/* this.icon = new L.Icon({
			iconUrl: playerImg,
			iconAnchor: L.Icon.Default.prototype.options.iconAnchor
		}); */

		// Awesome!
		this.icon = new SVGIcon({
			iconAnchor: L.Icon.Default.prototype.options.iconAnchor,
			svgLink: playerSVG,
			color: Color.hexToRGB(this.info.plyrData?.color ?? "#FFAA00")
		});

		this.marker = L.marker(this.pos, {
			icon: this.icon,
			zIndexOffset: 100
		});

		this.marker.addTo(this.map.map);

		if (this.isLocalPlayer) {
			this.map.map.panTo(this.pos);

			this.energyDisplay = new EnergyDisplay(document.getElementById("gameEnergy"), this);
			this.scoreDisplay = new ScoreDisplay(document.getElementById("gameScore"), this);

			this.map.bindMapEvents();
		}
		else {
			this.marker.setOpacity(0);
		}

		this.router = new PlayerRouter(this.map.map, this);

		this.bindEvents();

		Time.bindToFrame(() => {
			this.onFrame();
		});
	}

	isMoveOrderValid(target?: L.LatLng): boolean {
		if (this.moveQueue.length > 0) return false;
		if (!this.hasTurn()) return false;

		if (target) {
			const distToTarget = GameMap.nonMetricDistanceTo(this.pos, target);

			if (distToTarget > this.stats.visibility) return false;
			if (distToTarget > this.stats.energy * this.metersPerEnergyUnit) return false;
		}

		return true;
	}

	isPosInRange(pos: L.LatLng, range: number) {
		return GameMap.nonMetricDistanceTo(pos, this.pos) <= range;
	}

	isPosVisible(pos: L.LatLng) { // Whether the given position is within visibility range
		return GameMap.nonMetricDistanceTo(pos, this.pos) <= this.stats.visibility / 1.5;
	}

	createFogOfWar() {
		this.fow = new FogOfWar(this.map, this);
		this.fow.setVisibilityRadius(this.stats.visibility);
		this.fow.setVisibilityPos(this.pos);
	}

	bindEvents() {
		// Reminder, you can always double click.
		/* this.map.map.on("click", (e: L.LeafletMouseEvent) => {
			this.moveToTarget(e.latlng);
			Log.log(e);
		}); */

		this.map.events.on("MarkerActivated", (targetPos: L.LatLng) => {
			this.moveToTarget(targetPos);
		});

		this.game.eventHandler.on("PlayerMove", async (res: GameEventData) => { this.onMoveEvent(res); });
		this.game.eventHandler.on("PlayerRest", async (res: GameEventData) => { this.onRestEvent(res); });

		this.game.events.on("GameStateChanged", (newState: GameState, prevState: GameState) => {
			if(newState !== GameState.PlayerInteracting && this.nearbyObjects){
				this.map.unhighlightObjects(this.nearbyObjects);
				this.nearbyObjects = null;
				return;
			}

			if(!this.hasTurn()) return;
			if(newState !== GameState.PlayerInteracting) return;

			if(this.map.activeObject){
				this.map.popOpenQuestion();
			}
			else{
				this.map.highlightObjects(this.nearbyObjects);
			}
		});
	}

	moveToTarget(target: L.LatLng) {
		if (!this.isMoveOrderValid(target)) return;

		this.router.routeToPoint(target, (routeEv: L.Routing.RoutingResultEvent) => {
			const distance = routeEv.routes[0].summary.totalDistance;

			if (distance > this.stats.energy * this.metersPerEnergyUnit) {
				this.router.clearRoute();
				return;
			}

			const data: MoveEventData = {
				targetPos: target,
				route: routeEv.routes[0]
			};

			const moveEvent = new GameEvent("PlayerMove", data);
			this.game.eventHandler.dispatchEvent(moveEvent);
		});
	}

	moveAlongRoute(route: L.Routing.IRoute) {
		for (const p of route.coordinates) {
			this.moveToPoint(p);
		}

		if (this.isLocalPlayer) this.map.map.dragging.disable();
	}

	moveToPoint(p: L.LatLng) {
		if (this.moving) {
			this.moveQueue.push(p);
			return;
		}

		this.moving = true;
		this.targetPos = p;
		this.initialMovePos = this.pos;
		this.moveInterpolater = 0;

		this.distanceToTarget = GameMap.nonMetricDistanceTo(this.pos, this.targetPos);
		this.moveFractionPerSecond = this.speed / this.distanceToTarget;
	}

	private onMoveEvent(e: GameEventData) {
		if (this.game.isMultiplayer && e.origin !== this.info.socketID) return;

		this.activeRoute = e.event.data.route;
		const distance = this.activeRoute.summary.totalDistance;

		this.stats.walkedDistance += distance;
		this.drainEnergy(distance / this.metersPerEnergyUnit);

		this.moveAlongRoute(this.activeRoute);

		// If the game isn't multiplayer, update the time

		if (!this.game.isMultiplayer) {
			const visibilityFraction = GameMap.nonMetricDistanceTo(this.pos, e.event.data.targetPos) / this.stats.visibility;
			this.game.clock.addTime(visibilityFraction * this.info.timeToVisibilityEnd);
		}
	}

	private onRestEvent(e: GameEventData) {
		if (this.game.isMultiplayer && e.origin !== this.info.socketID) return;

		this.drainEnergy(-(this.info.metersToVisibilityEnd / this.metersPerEnergyUnit));

		if (!this.game.isMultiplayer) {
			this.game.clock.addTime(this.info.restTime);
		}

		if (this.isLocalPlayer) {
			this.events.emit("ActionDone");
		}
	}

	setPos(newPos: L.LatLng) {
		this.marker.setLatLng(newPos);

		if (this.isLocalPlayer) {
			this.map.map.panTo(newPos);
			this.fow.setVisibilityPos(newPos);
		}

		this.pos = newPos;
	}

	cancelMove() {
		this.moveQueue = [];
		this.moving = false;
		this.router.clearRoute();
		this.map.map.dragging.enable();
	}

	drainEnergy(amount: number) {
		this.stats.energy = MathExtras.clamp(this.stats.energy - Math.round(amount), 0, this.stats.maxEnergy);
		if (this.isLocalPlayer) this.energyDisplay.updateEnergy();
	}

	traceRoute(targetPos: L.LatLng, cb: TracingCallback = () => { }) {
		if (this.game.state !== GameState.PlayerAction) return;
		if (this.game.turnMan.activePlayer !== this) return;
		if (GameMap.nonMetricDistanceTo(this.pos, targetPos) > this.stats.visibility) return;

		// let route = null;
		this.router.routeToPoint(targetPos, (routeEv: L.Routing.RoutingResultEvent) => {
			// route = routeEv.routes[0];
			if (routeEv.routes.length === 0) return;
			cb(routeEv.routes[0]);
		});

		// return route;
	}

	killRoute() {
		if (!this.router.activeRoute) return;
		this.router.clearRoute();
	}

	hasTurn(): boolean {
		if (this.game.state !== GameState.PlayerAction && this.game.state !== GameState.PlayerInteracting) return false;
		if (this.game.turnMan.activePlayer !== this) return false;

		return true;
	}

	rest() {
		const restEvent = new GameEvent("PlayerRest");
		this.game.eventHandler.dispatchEvent(restEvent);
	}

	incrementScore() {
		this.stats.score++;
		if (this.isLocalPlayer) this.scoreDisplay.update();

		this.game.checkGameEndCondition();
	}

	updateInfo(newInfo: PlayerInfo) {
		this.info = Object.assign({}, newInfo);

		this.setPos(this.pos);

		// Update visible markers

		for (const id of this.info.visibleMarkers) {
			this.map.objectsByID[id].showMarker();
		}
	}

	updateStats(newStats: PlayerStats) {
		this.stats = Object.assign({}, newStats);

		if (this.isLocalPlayer) {
			this.energyDisplay.updateEnergy();
			this.scoreDisplay.update();
		}
	}

	getMapObjectsInRange(range: number = this.stats.visibility): MapObject[]{
		const nearbyObjects: MapObject[] = [];

		for(const obj of Object.values(this.map.objectsByID)){
			if(this.isPosInRange(obj.pos, range)) nearbyObjects.push(obj); // Perhaps there's a more efficient way of implementing this?
		}

		return nearbyObjects;
	}

	private onRouteEnd() {
		if(!this.isLocalPlayer) return;

		this.router.clearRoute();
		this.map.map.dragging.enable();

		this.nearbyObjects = this.getMapObjectsInRange(this.info.markerInteractionRange).filter(obj => !obj.answered);

		if(this.nearbyObjects.length > 0) {
			this.game.setGameState(GameState.PlayerInteracting);
		}
		else{
			this.events.emit("ActionDone");
		}
	}

	private onFrame() {
		if (this.moving) {
			this.moveInterpolater += this.moveFractionPerSecond * (Time.deltaTime / 1000);

			if (this.moveInterpolater > 1) {
				this.setPos(this.targetPos);
				this.moving = false;

				if (this.moveQueue.length === 0) {
					this.onRouteEnd();
				}
			}
			else {
				this.setPos(MathExtras.lerpPoint(this.initialMovePos, this.targetPos, this.moveInterpolater));
			}

			// Check whether a player is visible
			// Absolute cancer

			for (const plyr of this.game.otherPlayers) {
				if (this.game.localPlayer.isPosVisible(plyr.pos)) {
					plyr.marker.setOpacity(1);
				}
				else {
					plyr.marker.setOpacity(0);
				}
			}
		}

		if (this.moveQueue.length > 0 && !this.moving) {
			this.moveToPoint(this.moveQueue.shift());
		}
	}
}
