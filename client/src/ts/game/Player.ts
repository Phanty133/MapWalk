import * as L from "leaflet";
import Log from "ts/lib/log";
import PlayerRouter from "ts/map/PlayerRouter";
import playerImg from "img/player.png";
import "leaflet-routing-machine";
import Map from "ts/map/map";
import Game, { GameState } from "./Game";
import Time from "./Time";
import MathExtras from "ts/lib/MathExtras";
import FogOfWar from "ts/map/FogOfWar";
import { EventEmitter } from "events";
import EnergyDisplay from "ts/ui/gameui/EnergyDisplay";
import MapObject from "ts/map/MapObject";

type TracingCallback = (route: L.Routing.IRoute) => void;

export interface PlayerStats {
	energy: number;
	maxEnergy: number;
	score: number;
	visibility: number;
	walkedDistance: number;
	timeToVisibilityEnd: number;
	restTime: number;
}

export default class Player {
	private router: PlayerRouter;
	private map: Map;
	private game: Game;
	private icon: L.Icon;
	private initialMovePos: L.LatLng;
	private distanceToTarget: number;
	private moveFractionPerSecond: number;
	private moveInterpolater: number;
	private moveQueue: L.LatLng[] = [];
	private energyDisplay: EnergyDisplay;
	private metersToVisibilityEnd: number;

	speed = 0.005; // Units/sec
	metersPerEnergyUnit = 10;
	moving = false;
	marker: L.Marker;
	pos: L.LatLng;
	targetPos: L.LatLng;
	active = false; // Whether the player can perform an action
	stats: PlayerStats;
	fow: FogOfWar;

	events: EventEmitter = new EventEmitter();

	constructor(map: Map, game: Game, startingPos?: L.LatLng) {
		this.map = map;
		this.game = game;

		if (startingPos) {
			this.pos = startingPos;
		}
		else {
			this.pos = new L.LatLng(56.509376, 21.011428);
		}

		this.map.map.panTo(this.pos);

		this.stats = {
			energy: 10100000,
			maxEnergy: 10100000,
			score: 0,
			visibility: 0.005, // The radius of visible area in coord units
			walkedDistance: 0,
			timeToVisibilityEnd: 10, // Time to reach the end of the visibility radius in minutes
			restTime: 10
		};

		this.fow = new FogOfWar(this.map, this);
		this.fow.setVisibilityRadius(this.stats.visibility);
		this.fow.setVisibilityPos(this.pos);

		this.icon = new L.Icon({
			iconUrl: playerImg,
			iconAnchor: L.Icon.Default.prototype.options.iconAnchor
		});

		this.marker = L.marker(this.pos, {
			icon: this.icon
		}).addTo(this.map.map);

		this.router = new PlayerRouter(this.map.map, this);

		this.map.bindMapEvents();
		this.bindMovementEvents();

		this.energyDisplay = new EnergyDisplay(document.getElementById("gameEnergy"), this);
		this.metersToVisibilityEnd = this.pos.distanceTo(new L.LatLng(this.pos.lat + this.stats.visibility, this.pos.lng));

		Time.bindToFrame(() => {
			this.onFrame();
		});
	}

	private isMoveOrderValid(target?: L.LatLng): boolean{
		if(this.moveQueue.length > 0) return false;
		if(!this.hasTurn()) return false;

		if(target){
			const distToTarget = Map.nonMetricDistanceTo(this.pos, target);

			if (distToTarget > this.stats.visibility) return false;
			if (distToTarget > this.stats.energy * this.metersPerEnergyUnit) return false;
		}

		return true;
	}

	bindMovementEvents() {
		// Reminder, you can always double click.
		/* this.map.map.on("click", (e: L.LeafletMouseEvent) => {
			this.moveToTarget(e.latlng);
			Log.log(e);
		}); */

		this.map.events.on("MarkerActivated", (targetPos: L.LatLng) => {
			this.moveToTarget(targetPos);
		});
	}

	moveToTarget(target: L.LatLng) {
		if(!this.isMoveOrderValid(target)) return;

		this.router.routeToPoint(target, (routeEv: L.Routing.RoutingResultEvent) => {
			const distance = routeEv.routes[0].summary.totalDistance;

			if (distance > this.stats.energy * this.metersPerEnergyUnit) {
				this.router.clearRoute();
				return;
			}

			this.stats.walkedDistance += distance;
			this.drainEnergy(distance / this.metersPerEnergyUnit);
			Log.log("Energy: " + this.stats.energy);

			this.moveAlongRoute(routeEv.routes[0]);

			// If the game isn't multiplayer, update the time

			if(!this.game.isMultiplayer){
				const visibilityFraction = Map.nonMetricDistanceTo(this.pos, target) / this.stats.visibility;
				this.game.clock.addTime(visibilityFraction * this.stats.timeToVisibilityEnd);
			}
		});
	}

	moveAlongRoute(route: L.Routing.IRoute) {
		for (const p of route.coordinates) {
			this.moveToPoint(p);
		}

		this.map.map.dragging.disable();
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

		this.distanceToTarget = Map.nonMetricDistanceTo(this.pos, this.targetPos);
		this.moveFractionPerSecond = this.speed / this.distanceToTarget;
	}

	setPos(newPos: L.LatLng) {
		this.marker.setLatLng(newPos);
		this.map.map.panTo(newPos);
		this.pos = newPos;
		this.fow.setVisibilityPos(newPos);
	}

	cancelMove() {
		this.moveQueue = [];
		this.moving = false;
		this.router.clearRoute();
		this.map.map.dragging.enable();
	}

	drainEnergy(amount: number) {
		this.stats.energy = MathExtras.clamp(this.stats.energy - Math.round(amount), 0, this.stats.maxEnergy);
		this.energyDisplay.updateEnergy();
	}

	traceRoute(targetPos: L.LatLng, cb: TracingCallback = () => { }) {
		if (this.game.state !== GameState.PlayerAction) return;
		if (this.game.turnMan.activePlayer !== this) return;
		if (Map.nonMetricDistanceTo(this.pos, targetPos) > this.stats.visibility) return;

		// let route = null;
		this.router.routeToPoint(targetPos, (routeEv: L.Routing.RoutingResultEvent) => {
			// route = routeEv.routes[0];
			if (routeEv.routes.length === 0) return;
			cb(routeEv.routes[0]);
		});

		// return route;
	}

	killRoute() {
		this.router.clearRoute();
	}

	hasTurn(): boolean {
		if (this.game.state !== GameState.PlayerAction) return false;
		if (this.game.turnMan.activePlayer !== this) return false;

		return true;
	}

	rest(){
		this.game.clock.addTime(this.stats.restTime);
		this.drainEnergy(-(this.metersToVisibilityEnd / this.metersPerEnergyUnit));
	}

	private onFrame() {
		if (this.moving) {
			this.moveInterpolater += this.moveFractionPerSecond * (Time.deltaTime / 1000);

			if (this.moveInterpolater > 1) {
				this.setPos(this.targetPos);
				this.moving = false;

				if (this.moveQueue.length === 0) {
					this.router.clearRoute();
					this.map.map.dragging.enable();
					this.events.emit("MoveDone");
				}
			}
			else {
				this.setPos(MathExtras.lerpPoint(this.initialMovePos, this.targetPos, this.moveInterpolater));
			}
		}

		if (this.moveQueue.length > 0 && !this.moving) {
			this.moveToPoint(this.moveQueue.shift());
		}
	}
}
