import * as L from "leaflet";
import Log from "ts/lib/log";
import PlayerRouter from "ts/map/PlayerRouter";
import playerImg from "img/player.png";
import "leaflet-routing-machine";
import Map from "ts/map/map";
import Game, { GameState } from "./Game";
import Time from "./Time";
import MathExtras from "ts/lib/MathExtras";

export interface PlayerStats{
	energy: number;
	score: number;
	visibility: number;
	walkedDistance: number;
}

export default class Player{
	private router: PlayerRouter;
	private map: Map;
	private game: Game;
	private icon: L.Icon;
	private initialMovePos: L.LatLng;
	private distanceToTarget: number;
	private moveFractionPerSecond: number;
	private moveInterpolater: number;
	private moveQueue: L.LatLng[] = [];

	speed = 0.005; // Units/sec
	metersPerEnergyUnit = 10;
	moving = false;
	marker: L.Marker;
	pos: L.LatLng;
	targetPos: L.LatLng;
	active = false; // Whether the player can perform an action
	stats: PlayerStats;

	constructor(map: Map, game: Game) {
		this.map = map;
		this.game = game;
		this.pos = new L.LatLng(56.509376, 21.011428);
		this.stats = {
			energy: 100,
			score: 0,
			visibility: 0.01, // The radius of visible area in coord units
			walkedDistance: 0
		};

		this.icon = new L.Icon({
			iconUrl: playerImg,
			iconAnchor: L.Icon.Default.prototype.options.iconAnchor
		});

		this.marker = L.marker(this.pos, {
			icon: this.icon
		}).addTo(this.map.map);

		this.map.player = this.marker;
		this.router = new PlayerRouter(this.map.map, this);

		this.bindOnClick();

		Time.bindToFrame(() => {
			this.onFrame();
		});
	}

	bindOnClick(){
		this.map.map.on("click", (e: L.LeafletMouseEvent) => {
			this.moveToTarget(e.latlng);
		});

		this.map.events.on("MarkerActivated", (e: L.Marker) => {
			this.router.routeToPoint(e.getLatLng(), (routeEv: L.Routing.RoutingResultEvent) => {
				this.moveAlongRoute(routeEv.routes[0]);
			});
		});
	}

	moveToTarget(target: L.LatLng){
		if(this.moveQueue.length > 0) return;
		if(this.game.state !== GameState.PlayerAction) return;
		if(this.game.turnMan.activePlayer !== this) return;
		if(Map.nonMetricDistanceTo(this.pos, target) > this.stats.visibility) return;

		this.router.routeToPoint(target, (routeEv: L.Routing.RoutingResultEvent) => {
			const distance = routeEv.routes[0].summary.totalDistance;

			if(distance > this.stats.energy * this.metersPerEnergyUnit) {
				this.router.clearRoute();
				return;
			}

			this.stats.walkedDistance += distance;
			this.drainEnergy(distance / this.metersPerEnergyUnit);
			Log.log("Energy: ", this.stats.energy);
			this.moveAlongRoute(routeEv.routes[0]);
		});
	}

	moveAlongRoute(route: L.Routing.IRoute) {
		for (const p of route.coordinates) {
			this.moveToPoint(p);
		}
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
	}

	cancelMove(){
		this.moveQueue = [];
		this.moving = false;
		this.router.clearRoute();
	}

	drainEnergy(amount: number){
		this.stats.energy -= amount;
	}

	private onFrame(){
		if(this.moving){
			this.moveInterpolater += this.moveFractionPerSecond * (Time.deltaTime / 1000);

			if (this.moveInterpolater > 1) {
				this.setPos(this.targetPos);
				this.moving = false;

				if(this.moveQueue.length === 0){
					this.router.clearRoute();
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
