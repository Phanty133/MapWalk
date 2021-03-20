import ValueSelection from "./ValueSelection";
import * as L from "leaflet";

export interface Location{
	value: string;
	pos: L.LatLng;
}

export default class LocationSelection extends ValueSelection{
	static locations: Location[] = [
		{ value: "eastBorder", pos: new L.LatLng(56.5345689, 21.0991783) },
		{ value: "southBorder", pos: new L.LatLng(56.4702499, 21.0097293) },
		{ value: "station", pos: new L.LatLng(56.5232138, 21.0178781) },
		{ value: "university", pos: new L.LatLng(56.5088329, 21.008155) }
	];

	public get value(){
		return LocationSelection.locations.find(loc => loc.value === this.rawValue);
	}

	constructor(containerSelector: string){
		super(containerSelector, "Starting location", [
			{ displayName:"Liepājas austrumu robeža", value: "eastBorder" },
			{ displayName:"Liepājas dienvidu robeža", value: "southBorder" },
			{ displayName:"Liepājas autoosta un dzelzceļa stacija", value: "station" },
			{ displayName:"Liepājas universitāte", value: "university" }
		]);
	}
}
