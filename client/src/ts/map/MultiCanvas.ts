import createElement from "ts/lib/createElement";
import MathExtras from "ts/lib/MathExtras";
import Vector2 from "ts/lib/Vector2";
import DynamicElement from "ts/ui/DynamicElement";

interface RectDrawEntry{
	pos: Vector2;
	size: Vector2;
	ctx: CanvasRenderingContext2D;
}

export default class MultiCanvas extends DynamicElement{
	private pos: Vector2;
	private canvasSize: Vector2;
	private canvasGrid: boolean[][];
	private canvasCtxGrid: CanvasRenderingContext2D[][] = [];

	public get container(): HTMLElement{
		return this.objectContainer;
	}

	constructor(canvasSize: Vector2, canvasGrid: boolean[][], container: string | HTMLElement){
		super(container);

		this.canvasSize = canvasSize;
		this.canvasGrid = canvasGrid;

		this.createBase();
	}

	protected createBase(){
		this.objectContainer = createElement("div", {
			parent: this.mainContainer,
			style: {
				display: "grid",
				gridTemplateColumns: `repeat(${this.canvasGrid[0].length}, ${this.canvasSize.x}px)`,
				gridTemplateRows: `repeat(${this.canvasGrid.length}, ${this.canvasSize.y}px)`
			}
		});

		for(const row of this.canvasGrid){
			const canvasRow: CanvasRenderingContext2D[] = []

			for(const col of row){
				if(col){ // Check if it is a canvas cell
					const canvas = createElement("canvas", {
						parent: this.objectContainer,
						attr: {
							width: this.canvasSize.x.toString(),
							height: this.canvasSize.y.toString()
						}
					}) as HTMLCanvasElement;

					canvasRow.push(canvas.getContext("2d"));
				}
				else{ // If not a canvas cell, add a placeholder element
					createElement("div", {
						parent: this.objectContainer,
						class: "MultiCanvasEmptyCell"
					});

					canvasRow.push(null);
				}
			}

			this.canvasCtxGrid.push(canvasRow);
		}
	}

	private distributeRect(x: number, y: number, w: number, h: number): RectDrawEntry[][]{
		const firstCanvasRow = Math.floor(y / this.canvasSize.y);
		const firstCanvasCol = Math.floor(x / this.canvasSize.x);

		const canvasX = x % this.canvasSize.x;
		const canvasY = y % this.canvasSize.y;

		const rectRight = canvasX + w;
		const rectBottom = canvasY + h;

		const drawGrid: RectDrawEntry[][] = [];

		for(const row of this.canvasGrid){ drawGrid.push([]); }

		drawGrid[firstCanvasRow][firstCanvasCol] = {
			pos: new Vector2(canvasX, canvasY),
			size: new Vector2(w, h),
			ctx: this.canvasCtxGrid[firstCanvasRow][firstCanvasCol]
		};

		if(rectRight > this.canvasSize.x || rectBottom > this.canvasSize.y){
			const firstCanvasWidth = MathExtras.clamp(this.canvasSize.x * (firstCanvasCol + 1) - x, 0, w);
			const firstCanvasHeight = MathExtras.clamp(this.canvasSize.y * (firstCanvasRow + 1) - y, 0, h);

			drawGrid[firstCanvasRow][firstCanvasCol].size = new Vector2(firstCanvasWidth, firstCanvasHeight);

			const totalRemainingWidth = rectRight - canvasX - firstCanvasWidth;

			let remainingWidth = totalRemainingWidth;
			let remainingHeight = rectBottom - canvasY - firstCanvasHeight;

			let deltaCol = 0;
			let deltaRow = 0;

			while(
				(remainingHeight > 0 || remainingWidth > 0)
				&& deltaRow + firstCanvasRow < this.canvasGrid.length
				&& deltaCol + firstCanvasCol < this.canvasGrid[0].length
			){
				if(remainingWidth > 0){
					deltaCol++;
				}
				else if(remainingHeight > 0){
					deltaRow++;
					deltaCol = 0;
					remainingWidth = totalRemainingWidth;
				}

				const pos = new Vector2(); // Defaults to 0,0

				if(deltaRow === 0) pos.y = canvasY;
				if(deltaCol === 0) pos.x = canvasX;

				const size = new Vector2();

				if(deltaCol === 0) {
					size.x = firstCanvasWidth;
				}
				else{
					size.x = MathExtras.clamp(remainingWidth, 0, this.canvasSize.x);
					remainingWidth -= size.x;
				}

				if(deltaRow === 0){
					size.y = firstCanvasHeight;
				}
				else{
					if(deltaCol === 0) {
						size.y = MathExtras.clamp(remainingHeight, 0, this.canvasSize.y);
						remainingHeight -= size.y;
					}
					else{
						size.y = drawGrid[firstCanvasRow + deltaRow][firstCanvasCol].size.y;
					}
				}

				if(!this.canvasCtxGrid[firstCanvasRow + deltaRow]) continue;

				drawGrid[firstCanvasRow + deltaRow][firstCanvasCol + deltaCol] = {
					pos,
					size,
					ctx: this.canvasCtxGrid[firstCanvasRow + deltaRow][firstCanvasCol + deltaCol]
				};
			}
		}

		return drawGrid;
	}

	fillRect(x: number, y: number, w: number, h: number, color: string){
		for(const drawRow of this.distributeRect(x, y, w, h)){
			for(const drawCol of drawRow){
				if(!drawCol) continue;
				if(!drawCol.ctx) continue;

				drawCol.ctx.fillStyle = color;
				drawCol.ctx.fillRect(drawCol.pos.x, drawCol.pos.y, drawCol.size.x, drawCol.size.y);
			}
		}
	}

	clearRect(x: number, y: number, w: number, h: number){
		for(const drawRow of this.distributeRect(x, y, w, h)){
			for(const drawCol of drawRow){
				if(!drawCol) continue;
				if(!drawCol.ctx) continue;

				drawCol.ctx.clearRect(drawCol.pos.x, drawCol.pos.y, drawCol.size.x, drawCol.size.y);
			}
		}
	}

	fillCircle(cx: number, cy: number, r: number, color: string){ // Doesn't work if the circle is in more than 4 cells
		const topLeft = new Vector2(cx - r, cy - r);
		const drawGrid: RectDrawEntry[][] = this.distributeRect(topLeft.x, topLeft.y, r * 2, r * 2);

		for(const drawRow of drawGrid){
			for(const drawCol of drawRow){
				if(!drawCol) continue;
				if(!drawCol.ctx) continue;

				let arcCX = 0;
				let arcCY = 0;

				if(drawCol.pos.x === 0){
					arcCX = drawCol.pos.x + drawCol.size.x - r;
				}
				else{
					arcCX = drawCol.pos.x + r;
				}

				if(drawCol.pos.y === 0){
					arcCY = drawCol.pos.y + drawCol.size.y - r;
				}
				else{
					arcCY = drawCol.pos.y + r;
				}

				drawCol.ctx.beginPath();
				drawCol.ctx.fillStyle = color;
				drawCol.ctx.arc(arcCX, arcCY, r, 0, 2 * Math.PI);
				drawCol.ctx.fill();
				drawCol.ctx.closePath();
			}
		}
	}

	clearCircle(cx: number, cy: number, r: number){
		const topLeft = new Vector2(cx - r, cy - r);
		const drawGrid: RectDrawEntry[][] = this.distributeRect(topLeft.x, topLeft.y, r * 2, r * 2);

		for(const drawRow of drawGrid){
			for(const drawCol of drawRow){
				if(!drawCol) continue;
				if(!drawCol.ctx) continue;

				let arcCX = 0;
				let arcCY = 0;

				if(drawCol.pos.x === 0){
					arcCX = drawCol.pos.x + drawCol.size.x - r;
				}
				else{
					arcCX = drawCol.pos.x + r;
				}

				if(drawCol.pos.y === 0){
					arcCY = drawCol.pos.y + drawCol.size.y - r;
				}
				else{
					arcCY = drawCol.pos.y + r;
				}

				drawCol.ctx.save();

				drawCol.ctx.beginPath();
				drawCol.ctx.arc(arcCX, arcCY, r, 0, 2 * Math.PI);
				drawCol.ctx.clip();
				drawCol.ctx.clearRect(0, 0, this.canvasSize.x, this.canvasSize.y);
				drawCol.ctx.closePath();

				drawCol.ctx.restore();
			}
		}
	}
}