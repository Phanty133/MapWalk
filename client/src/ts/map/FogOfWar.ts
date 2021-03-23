import Player from "ts/game/Player";
import GameMap from "ts/map/GameMap";
import * as L from "leaflet";
import Log from "ts/lib/log";
import "leaflet-customlayer";
import MultiCanvas from "./MultiCanvas";
import Vector2 from "ts/lib/Vector2";

export default class FogOfWar{
	player: Player;
	map: GameMap;
	private ctx: CanvasRenderingContext2D;
	private canvasSize: L.Point;
	private canvasOffset: L.Point;
	private panOffset: L.Point;
	private canvasRadius: number = 50;
	private prevCanvasPos: L.Point;
	private multiCanvas: MultiCanvas;
	private relativeCanvasReferencePoint: L.Point;

	constructor(map: GameMap, player: Player){
		this.player = player;
		this.map = map;

		this.drawOverlay();
	}

	drawOverlay(){
		// Absolut Jank TM

		const screenCoefX = 8;
		const screenCoefY = 11;

		const div = document.createElement("div");
		const canvasContainer = document.createElement("div");

		div.appendChild(canvasContainer);

		this.canvasSize = new L.Point(window.innerWidth * screenCoefX, window.innerHeight * screenCoefY);
		this.canvasOffset = new L.Point(this.canvasSize.x / 2, this.canvasSize.y / 2);
		this.relativeCanvasReferencePoint = this.map.map.latLngToLayerPoint(new L.LatLng(56.509376, 21.011428));

		const canvasGrid = [
			[false, false, false, false, false, false, false, false],
			[false, false, false, true, true, true, true, false],
			[false, false, false, true, true, true, true, false],
			[false, false, false, true, true, true, true, false],
			[false, false, false, true, true, true, true, false],
			[false, false, false, true, true, true, true, false],
			[false, false, false, true, true, true, true, false],
			[false, false, false, true, true, true, true, false],
			[false, false, false, true, true, true, true, false],
			[false, false, false, false, false, false, false, false],
			[false, false, false, false, false, false, false, false]
		];

		this.multiCanvas = new MultiCanvas(new Vector2(window.innerWidth, window.innerHeight), canvasGrid, canvasContainer);

		this.multiCanvas.container.style.transform = `translate3d(${-(this.canvasOffset.x - this.relativeCanvasReferencePoint.x)}px, ${-this.canvasOffset.y + this.relativeCanvasReferencePoint.y}px, 0px)`;

		// @ts-ignore
		const customLayer = new L.customLayer({
			container: div,
			minZoom: 0,
			maxZoom: 18,
			opacity: 1,
			visibile: true,
			zIndex: 100
		});

		let initial = true;

		customLayer.on("layer-render", () => {
			// Offset THE PAN to make the canvas hold a static position relative to the world
			const cssTransform = div.style.transform;
			const regexp = /translate3d\((?<x>-?\d+)px, (?<y>-?\d+)px, (-?\d+)px\)/;
			const match = cssTransform.match(regexp);

			if(initial){
				initial = false;

				this.multiCanvas.fillRect(0, 0, this.canvasSize.x, this.canvasSize.y, "rgba(0, 0, 0, 0.95)");
			}

			if(!match) return;

			this.panOffset = new L.Point(parseInt(match.groups.x, 10), parseInt(match.groups.y, 10));
			canvasContainer.style.transform = `translate3d(${-this.panOffset.x}px, ${-this.panOffset.y}px, 0px)`;
		});

		customLayer.addTo(this.map.map);
	}

	layerPointToCanvasPoint(p: L.Point){
		return new L.Point(
			this.canvasOffset.x + p.x - this.relativeCanvasReferencePoint.x,
			this.canvasOffset.y + p.y - this.relativeCanvasReferencePoint.y
		);
	}

	latLngToCanvasPoint(p: L.LatLng){
		return this.layerPointToCanvasPoint(this.map.map.latLngToLayerPoint(p));
	}

	setVisibilityPos(worldPoint: L.LatLng){
		window.requestAnimationFrame(() => {
			const p = this.latLngToCanvasPoint(worldPoint);

			if(this.prevCanvasPos){
				this.multiCanvas.fillCircle(this.prevCanvasPos.x, this.prevCanvasPos.y, this.canvasRadius, "rgba(0, 0, 0, 0.3)");
			}

			this.multiCanvas.clearCircle(p.x, p.y, this.canvasRadius);

			this.prevCanvasPos = p;
		});
	}

	setVisibilityRadius(geoRadius: number){
		const latLngBounds: L.LatLngBounds = this.map.map.getBounds();
		const pixelBounds = this.map.map.getPixelBounds();

		const dLat = Math.abs(latLngBounds.getEast() - latLngBounds.getWest());
		const dLng = Math.abs(latLngBounds.getNorth() - latLngBounds.getSouth());

		const dX = Math.abs(pixelBounds.min.x - pixelBounds.max.x);
		const dY = Math.abs(pixelBounds.min.y - pixelBounds.max.y);

		const xRatio = dX / dLng;
		const yRatio = dY / dLat;
		const avgRatio = (xRatio + yRatio) / 2;

		this.canvasRadius = avgRatio * geoRadius / 2;
	}

	revealAll(){
		this.multiCanvas.clearRect(0, 0, this.canvasSize.x, this.canvasSize.y);
	}

	/*

	RIP
	SVG approach
	17.03.21 - 18.03.21.
	Lived a short, yet painful life

	drawBase(){
		this.svgContainer = document.querySelector("#fowSvg") as SVGElement;
		this.visibilityMask = this.svgContainer.querySelector("#visibilityMask circle");
		this.discoveryPath = this.svgContainer.querySelector("#exploredMask path");

		this.svgBounds = new L.LatLngBounds([[56.47, 20.95], [56.56, 21.1]]);
		this.svgOverlay = L.svgOverlay(this.svgContainer, this.svgBounds);
		this.svgOverlay.addTo(this.map.map);

		this.svgTopLeft = this.map.map.latLngToLayerPoint(this.svgBounds.getNorthWest());
		this.svgBottomRight = this.map.map.latLngToLayerPoint(this.svgBounds.getSouthEast());
	}

	private precalculateDiscoveryMask(){
		this.precalc = {
			angleBetweenPoints: 2 * Math.PI / this.discoveryVertices,
			visibilityTrigFunc: [],
			minDistanceBetweenPoints: 2 * Math.PI * this.visibilityRadius / this.discoveryVertices * 0.75
		}

		for(let i = 0; i < this.discoveryVertices; i++){
			const angle = this.precalc.angleBetweenPoints * i;

			this.precalc.visibilityTrigFunc.push(new L.Point(
				this.visibilityRadius * Math.cos(angle),
				this.visibilityRadius * Math.sin(angle)
			));
		}
	}

	setVisibilityPos(p: L.LatLng){
		this.visibilityPos = this.latLngToSVGCoord(p);

		this.visibilityMask.setAttribute("cx", this.visibilityPos.x.toString());
		this.visibilityMask.setAttribute("cy", this.visibilityPos.y.toString());

		this.updateVisibilityMaskPath();
	}

	setVisibilityRadius(r: number){
		this.visibilityRadius = this.geoUnitsToSVG(r);
		this.visibilityMask.setAttribute("r", this.visibilityRadius.toString());

		this.precalculateDiscoveryMask();
	}

	latLngToSVGCoord(p: L.LatLng): L.Point{
		const svgPointInBounds = this.map.map.latLngToLayerPoint(p);
		const relativeSvgPoint = new L.Point(svgPointInBounds.x - this.svgTopLeft.x, svgPointInBounds.y - this.svgTopLeft.y);

		const k = 1.08; // Absolut jank TM

		const svgWidth = this.svgBottomRight.x - this.svgTopLeft.x;
		const svgHeight = this.svgBottomRight.y - this.svgTopLeft.y;
		const fracX = relativeSvgPoint.x / svgWidth;
		const fracY = (relativeSvgPoint.y / svgHeight - 0.5) * k + 0.5;

		const svgX = 1000 * fracX;
		const svgY = 1000 * fracY;

		return new L.Point(svgX, svgY);
	}

	geoUnitsToSVG(g: number): number{
		const svgGeoSize = Math.abs(this.svgBounds.getNorthWest().lat - this.svgBounds.getSouthEast().lat);
		const svgCoordSize = 1000;
		return svgCoordSize * (g / svgGeoSize) / 1.15;
	}

	updateVisibilityMaskPath(){
		for(let i = 0; i < this.discoveryVertices; i++){
			setTimeout(() => {
				const svg = this.svgContainer as SVGSVGElement;
				const p = svg.createSVGPoint();
				p.x = this.precalc.visibilityTrigFunc[i].x + this.visibilityPos.x;
				p.y = this.precalc.visibilityTrigFunc[i].y + this.visibilityPos.y;

				if(!this.discoveryPath.isPointInFill(p)){
					if(this.discoveryData.length >= this.discoveryVertices){
						const i0 = this.getNearestPointIndex(this.discoveryData, p);

						if(this.svgPointDistance(this.discoveryData[i0], p) < this.precalc.minDistanceBetweenPoints){
							return;
						}

						let prevP = i0 - 1;

						if(prevP === -1) prevP = this.discoveryData.length - 1;

						const selfDistToClosestPrev = this.svgPointDistance(p, this.discoveryData[prevP]);
						const closestDistToClosestPrev = this.svgPointDistance(this.discoveryData[i0], this.discoveryData[prevP]);

						Log.log(i0);

						if(selfDistToClosestPrev >= closestDistToClosestPrev){
							this.discoveryData.splice(i0 + 1, 0, p);
						}
						else{
							this.discoveryData.splice(i0, 0, p);
						}
					}
					else{
						this.discoveryData.push(p);
					}

					this.discoveryPath.setAttribute("d", this.maskArrayToAttr(this.discoveryData));
				}
			}, 0);
		}

		// fml

		for(let i = 0; i < this.discoveryData.length; i++){
			if(this.visibilityMask.isPointInFill(this.discoveryData[i])){
				Log.log(i);
				this.discoveryData.splice(i, 1);
			}
		}

		this.discoveryPath.setAttribute("d", this.maskArrayToAttr(this.discoveryData));
	}

	private maskArrayToAttr(arr: SVGPoint[]){
		let buf: string = "";

		for(const p of arr){
			buf += `${buf === "" ? "M" : "L"} ${p.x} ${p.y}`;
		}

		return buf;
	}

	private getNearestPointIndex(arr: SVGPoint[], p: SVGPoint){
		let closestDist: number = Infinity;
		let closestIndex = arr.length - 1;

		for(let i = 0; i < arr.length; i++){
			const distToPoint = this.svgPointDistance(this.discoveryData[i], p);

			if(closestDist > distToPoint){
				closestDist = distToPoint;
				closestIndex = i;
			}
		}

		return closestIndex;
	}

	private svgPointDistance(p1: SVGPoint, p2: SVGPoint){
		return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
	} */
}