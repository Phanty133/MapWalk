import * as fse from "fs-extra";
import * as path from "path";

const buildConfig = fse.readJsonSync(process.argv[2]);
const cwd = process.cwd();

for(const dir of buildConfig.assets){
	let dirSep;

	if(dir.indexOf("/") === -1){
		dirSep = "\\";
	}
	else{
		dirSep = "/";
	}

	const dirName = dir.split(dirSep).pop();
	const src = path.join(cwd, dir);
	const newLinkDest = path.join(cwd, "build", dirName);

	fse.ensureSymlinkSync(src, newLinkDest, "dir");
	// tslint:disable-next-line: no-console
	console.log(`Ensured symlink to ${src} from ${newLinkDest}`);
}
