import * as fse from "fs-extra";
import path from "path";
import crypto from "crypto";

export function parseBool(str:string){
	return JSON.parse(str?.toLowerCase());
}

export function randInt(min: number, max: number): number{
	return Math.floor(Math.random() * (max - min) + min);
}

// Delete files with same name, different extension in specified directory
export function deleteSimilarFiles(dir: string, fileName: string, excludeType: string = ""): Promise<number>{
	return new Promise<number>((res, rej) => {
		const dirFiles: string[] = fse.readdirSync(dir);
		const similarFiles: string[] = dirFiles.filter(el => el.startsWith(fileName));
		const promiseArr: Promise<void>[] = [];
		let cnt = 0;

		for(const file of similarFiles){
			if(path.extname(file) === excludeType) continue;

			promiseArr.push(fse.remove(path.join(dir, file)));
			cnt++;
		}

		Promise.all(promiseArr)
		.then(() => {
			res(cnt);
		})
		.catch((err: Error) => {
			rej(err);
		});
	});
}

export function getExtensionByFilename(dir: string, nameMatch: string): string{
	const dirFiles = fse.readdirSync(dir);
	const match = dirFiles.find(el => el.match(new RegExp(`${nameMatch}\\.`)));

	if(match){
		return path.extname(match);
	}

	return "";
}

export function genHexString(len: number): string{
	const buffer = crypto.randomBytes(len / 2);
	return buffer.toString("hex");
}

export function randomArrayElements<T>(array: T[], count: number = 1): T[]{
	const arrCopy: T[] = [...array];
	const output: T[] = [];

	for(let i = 0; i < count; i++){
		const randIndex = randInt(0, arrCopy.length); // Select a random index from the remaining elements

		output.push(arrCopy.splice(randIndex, 1)[0]); // Remove the selected random element and push it to output
	}

	return output;
}
