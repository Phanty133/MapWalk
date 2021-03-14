export class MapObject {
	latLng: L.LatLngExpression;
	description: string;

	constructor(coord: L.LatLngExpression, desc: string) {
		this.latLng = coord;
		this.description = desc;
	}
}