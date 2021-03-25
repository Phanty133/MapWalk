import * as L from "leaflet";
import { SVGIcon } from "./SVGIcon";
import SVGMarkerOptions from "./SVGMarkerOptions";

// This was useless because SVGIcon works with regular markers lmfao
export default class SVGMarker extends L.Marker {
	options: SVGMarkerOptions = {
		svgIcon: new SVGIcon()
	};

	constructor(latlng: L.LatLng, options?: any) {
		super(latlng, options);
		this.options = L.Util.setOptions(this, options);

		this.options.icon = this.options.svgIcon;
	}
}