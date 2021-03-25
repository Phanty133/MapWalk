import * as L from "leaflet";

export default interface SVGIconOptions extends L.DivIconOptions {
	color: string;
	fillColor: string;
	fillOpacity: number;
	iconAnchor: L.Point;
	iconSize: L.Point;
	opacity: number;
	popupAnchor: L.Point;
	shadowAngle: number;
	shadowBlur: number;
	shadowColor: string;
	shadowEnable: boolean;
	shadowLength: number;
	shadowOpacity: number;
	shadowTranslate: L.Point;
	weight: number;
	svgLink: string;
	className: string;
}