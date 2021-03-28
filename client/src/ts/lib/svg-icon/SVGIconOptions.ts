import * as L from "leaflet";
import { Color } from "ts/lib/Color";

export default interface SVGIconOptions extends L.DivIconOptions {
	color: string | Color.RGB;
	iconAnchor: L.Point;
	iconSize: L.Point;
	opacity: number;
	popupAnchor: L.Point;
	shadowAngle: number;
	shadowBlur: number;
	shadowColor: string | Color.RGB;
	shadowEnable: boolean;
	shadowLength: number;
	shadowOpacity: number;
	shadowTranslate: L.Point;
	weight: number;
	svgLink: string;
	className: string;
	interactable: boolean;
}
