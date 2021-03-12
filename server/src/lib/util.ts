import * as fse from "fs-extra";
import path from "path";

export function parseBool(str:string){
	return JSON.parse(str.toLowerCase());
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
