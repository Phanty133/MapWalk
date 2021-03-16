import * as L from "leaflet";
import Log from "ts/lib/log";
import PlayerRouter from "ts/map/PlayerRouter";
import playerImg from "img/player.png";
import "leaflet-routing-machine";
import Map from "ts/map/map";
import Game from "./Game";
import Time, { FrameUpdateCallback } from "./Time";
import MathExtras from "ts/lib/MathExtras";

export default class Player{
	private router: PlayerRouter;
	private map: L.Map;
	private game: Game;
	private icon: L.Icon;
	private initialMovePos: L.LatLng;
	private distanceToTarget: number;
	private moveFractionPerSecond: number;
	private moveInterpolater: number;
	private moveQueue: L.LatLng[] = [];

	speed = 0.005; // Units/sec
	moving = false;
	marker: L.Marker;
	pos: L.LatLng;
	targetPos: L.LatLng;

	constructor(map: L.Map, game: Game){
		this.map = map;
		this.game = game;
		this.pos = new L.LatLng(56.509376, 21.011428);

		this.icon = new L.Icon({
			iconUrl: playerImg,
			iconAnchor: L.Icon.Default.prototype.options.iconAnchor
		});

		this.marker = L.marker(this.pos, {
			icon: this.icon
		}).addTo(this.map);

		this.router = new PlayerRouter(this.map, this);

		this.bindOnClick();

		Time.bindToFrame(() => {
			this.onFrame();
		});
	}

	bindOnClick(){
		this.map.on("click", (e: L.LeafletMouseEvent) => {
			this.router.routeToPoint(e.latlng, (routeEv: L.Routing.RoutingResultEvent) => {
				this.moveAlongRoute(routeEv.routes[0]);
			});
		});
	}

	moveAlongRoute(route: L.Routing.IRoute){
		for(const p of route.coordinates){
			this.moveToPoint(p);
		}
	}

	moveToPoint(p: L.LatLng){
		if(this.moving) {
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

	setPos(newPos: L.LatLng){
		this.marker.setLatLng(newPos);
		this.map.panTo(newPos);
		this.pos = newPos;
	}

	private onFrame(){
		if(this.moving){
			this.moveInterpolater += this.moveFractionPerSecond * (Time.deltaTime / 1000);

			if(this.moveInterpolater > 1){
				this.setPos(this.targetPos);
				this.moving = false;
			}
			else{
				this.setPos(MathExtras.lerpPoint(this.initialMovePos, this.targetPos, this.moveInterpolater));
			}
		}

		if(this.moveQueue.length > 0 && !this.moving){
			this.moveToPoint(this.moveQueue.shift());
		}
	}
}
