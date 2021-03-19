export default class Vector2{
	x: number;
	y: number;

	constructor(x?: number, y?: number){
		if(x === undefined && y === undefined){
			this.x = 0;
			this.y = 0;
		}
		else if(x !== undefined && y === undefined){
			this.x = x;
			this.y = x;
		}
		else if(x === undefined && y !== undefined){
			this.x = y;
			this.y = y;
		}
		else{
			this.x = x;
			this.y = y;
		}
	}

	add(other: Vector2){
		return new Vector2(this.x + other.x, this.y + other.y);
	}

	sub(other: Vector2){
		return new Vector2(this.x - other.x, this.y - other.y);
	}

	mul(other: Vector2){
		return new Vector2(this.x * other.x, this.y * other.y);
	}

	div(other: Vector2){
		return new Vector2(this.x / other.x, this.y / other.y);
	}

	eq(other: any){
		if(!(other instanceof Vector2)) return false;

		return this.x === other.x && this.y === other.y;
	}
}