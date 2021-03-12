import * as shell from "shelljs";
import * as fse from "fs-extra";
import * as process from "process";

// Read build config
const config = fse.readJsonSync(process.argv[2]);

fse.ensureDirSync("build");
for(const dir of config.assets){
	shell.cp("-R", dir, "build/");
	// tslint:disable-next-line: no-console
	console.log(`[copy-assets] Successfully copied ${dir}`);
}
