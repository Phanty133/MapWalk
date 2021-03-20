export class MapObject {
	latLng: L.LatLngExpression;
	name: string;
	description: string;
	image: string;

	constructor(coord: L.LatLngExpression, name: string, desc: string, image: string) {
		this.latLng = coord;
		this.description = desc;
		this.name = name;
		this.image = image;
	}
}