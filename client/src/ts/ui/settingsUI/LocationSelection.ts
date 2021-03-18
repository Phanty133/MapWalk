import ValueSelection from "./ValueSelection";
import * as L from "leaflet";

export interface Location{
	value: string;
	pos: L.LatLng;
}

export default class LocationSelection extends ValueSelection{
	static locations: Location[] = [
		{ value: "westBorder", pos: new L.LatLng(0, 0) },
		{ value: "southBorder", pos: new L.LatLng(0, 0) },
		{ value: "station", pos: new L.LatLng(0, 0) },
		{ value: "university", pos: new L.LatLng(0, 0) }
	];

	public get value(){
		return LocationSelection.locations.find(loc => loc.value === this.rawValue);
	}

	constructor(containerSelector: string){
		super(containerSelector, "Starting location", [
			{ displayName:"Liepājas rietumu robeža", value: "westBorder" },
			{ displayName:"Liepājas dienvidu robeža", value: "southBorder" },
			{ displayName:"Liepājas autoosta un dzelzceļa stacija", value: "station" },
			{ displayName:"Liepājas universitāte", value: "university" }
		]);
	}
}
