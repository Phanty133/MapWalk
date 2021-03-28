import path from "path";
import fse from "fs-extra";
import { randomArrayElements } from "./lib/util";

export interface ObjectData {
	name: string;
	description: string;
	image: string;
	location: { x: number, y: number };
};

export default class MapObjectLoader {
	private objectData: ObjectData[];
	private restData: ObjectData[];

	async loadObjects() {
		this.objectData = await fse.readJSON(path.join(__dirname, "..", "data", "objects-full.json"));
		this.restData = await fse.readJSON(path.join(__dirname, "..", "data", "restObjects.json"));
	}

	getRandomObjects(count: number): ObjectData[] {
		return randomArrayElements(this.objectData, count);
	}

	getRandomRestObjects(count: number): ObjectData[] {
		return randomArrayElements(this.restData, count);
	}
}