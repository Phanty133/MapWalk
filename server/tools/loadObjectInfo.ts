import fse from "fs-extra";
import path from "path";
import fetch from "node-fetch";

interface ObjectData{
	name: string,
	description: string,
	image: string
}

const dataPath = path.join(__dirname, "..", "data");
const mapInfo: string[] = fse.readJSONSync(path.join(dataPath, "mapInfo.json"));
const objectData: ObjectData[] = fse.readJSONSync(path.join(dataPath, "objects.json"));
const imgPath = path.join(dataPath, "img");

objectData.forEach((obj: ObjectData, i: number) => {
	const name = obj.name;
	const mapInfoEntry = mapInfo.find(e => e[0] === name);
	if(!mapInfoEntry) {
		console.log("Couldn't find: " + name);
		return;
	}

	objectData[i].description = mapInfoEntry[1];

	const imgURL = mapInfoEntry[2];
	const imgType = imgURL.split(".").pop();
	const imgName = `img-${name.replace(/ /g, "")}.${imgType}`;

	objectData[i].image = `/data/img/${imgName}`;
	downloadImg(imgURL, path.join(imgPath, imgName));
});

fse.writeJSONSync(path.join(dataPath, "objects-full.json"), objectData);

function downloadImg(uri: string, filepath: string){
	fetch(uri).then(res => {
		const dest = fse.createWriteStream(filepath);
		res.body.pipe(dest);
	});
};
