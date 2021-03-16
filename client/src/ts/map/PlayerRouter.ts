import * as L from "leaflet";
import "leaflet-routing-machine";
import Player from "ts/game/Player";
import Log from "ts/lib/log"

type RoutingCallback = (route?: L.Routing.RoutingResultEvent) => void;

export default class PlayerRouter{
	private static routingToken = "pk.eyJ1IjoicGhhbnR5IiwiYSI6ImNrOHZ5MXFoNjA0OWkzb3FwbngwOWI1NWIifQ.zKnx4A9kbXPiRAysdc0asA";
	private map: L.Map;
	private routingSettings: L.Routing.RoutingControlOptions;
	activeRoute: L.Routing.Control;
	player: Player;

	constructor(leafletMap: L.Map, player: Player){
		this.map = leafletMap;

		this.routingSettings = {
			router: L.routing.mapbox(PlayerRouter.routingToken, {}),
			routeWhileDragging: false,
			waypointMode: "snap",
			show: true,
			autoRoute: true,
			showAlternatives: false,
			addWaypoints: false,
			fitSelectedRoutes: false
		};

		this.player = player;
	}

	routeToPoint(p1: L.LatLng, cb: RoutingCallback = () => {}){
		if(this.activeRoute) {
			this.activeRoute.remove();
		}

		this.activeRoute = L.Routing.control(Object.assign({
			waypoints: [
				new L.Routing.Waypoint(this.player.pos, "plyrPos", { allowUTurn: true }),
				new L.Routing.Waypoint(p1, "p1", { allowUTurn: true })
			]
		}, this.routingSettings))
		.on("routesfound", cb)
		.addTo(this.map);
	}

	clearRoute(){
		this.activeRoute.remove();
	}
}
