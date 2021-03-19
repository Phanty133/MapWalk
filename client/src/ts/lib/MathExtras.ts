import * as L from "leaflet";
import Log from "./log";

export default class MathExtras{
	static lerpNumber(n0: number, n1: number, t: number){
		let clampedT: number = t;

		if(t < 0){
			clampedT = 0;
		}
		else if(t > 1){
			clampedT = 1;
		}

		return (n1 - n0) * clampedT + n0;
	}

	static lerpPoint(p0: L.LatLng, p1: L.LatLng, t: number){
		return new L.LatLng(
			MathExtras.lerpNumber(p0.lat, p1.lat, t),
			MathExtras.lerpNumber(p0.lng, p1.lng, t)
		);
	}

	static clamp(x: number, min: number, max: number){
		if(x < min) return min;
		if(x > max) return max;
		return x;
	}
}
