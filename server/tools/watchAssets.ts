import * as shell from "shelljs";
import * as fse from "fs-extra";
import * as process from "process";
import * as path from "path";

// Read build config
const config = fse.readJsonSync(process.argv[2]);

// tslint:disable: no-console
console.log("--- [watchAssets] ---");
console.log(config.assets.join("\n"));
console.log("---------------------");

for(const dir of config.assets){
    let dirSep;

	if(dir.indexOf("/") === -1){
		dirSep = "\\";
	}
	else{
		dirSep = "/";
	}

    const dirName = dir.split(dirSep).pop();
    shell.exec(`nodemon --ext "*" --watch ${dir} --exec "rimraf build/${dirName} & ts-node tools/copyAsset ${dir}"`);
}
