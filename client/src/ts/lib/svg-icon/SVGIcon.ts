// Cool SVG icon that works on typescript unlike a certain other one
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Color } from "../Color";
import SVGIconOptions from "./SVGIconOptions";

export class SVGIcon extends L.DivIcon {
	options: SVGIconOptions = {
		color: "rgb(255,255,255)",
		iconAnchor: null,
		iconSize: new L.Point(32, 48),
		opacity: 1,
		popupAnchor: null,
		shadowAngle: 45,
		shadowBlur: 1,
		shadowColor: "rgb(0,0,10)",
		shadowEnable: false,
		shadowLength: 0.75,
		shadowOpacity: 0.5,
		shadowTranslate: new L.Point(0, 0),
		weight: 2,
		className: "svgicon",
		iconUrl: null,
		svgLink: null
	};

	constructor(options?: any) {
		super(options);
		options = L.Util.setOptions(this, options);

		this.options.html = this._createSVG();
	}

	private _createSVG() {
		// const className = this.options.className + "-svg";
		let width = this.options.iconSize.x;
		let height = this.options.iconSize.y;

		if (this.options.shadowEnable) {
			width += this.options.iconSize.y * this.options.shadowLength - (this.options.iconSize.x / 2);
			width = Math.max(width, 32);
			height += this.options.iconSize.y * this.options.shadowLength;
		}

		const resEl = document.createElement("object") as HTMLObjectElement;
		// resEl.setAttribute("style", "fill:" + this.options.color + ";");
		resEl.setAttribute("data", this.options.svgLink);
		resEl.addEventListener("load", (ev) => {
			const innerSVAG = resEl.getSVGDocument();
			const pathAr = innerSVAG.getElementsByTagNameNS("http://www.w3.org/2000/svg", "path");
			for (const path of Object.values(pathAr)) {
				path.style.setProperty("fill", this.options.color);
				const strokeColour = Color.rgbStringToRGB(this.options.color);
				strokeColour.r /= 2;
				// strokeColour.r = Math.max(0, strokeColour.r);
				strokeColour.g /= 2;
				// strokeColour.g = Math.max(0, strokeColour.g);
				strokeColour.b /= 2;
				// strokeColour.b = Math.max(0, strokeColour.b);
				path.style.setProperty("stroke", Color.rgbToRGBString(strokeColour));
				path.style.setProperty("opacity", this.options.opacity.toString());
			}
		});
		const svg = resEl.outerHTML;

		return resEl;
	}
}
