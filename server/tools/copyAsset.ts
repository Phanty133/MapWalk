import * as shell from "shelljs";
import * as process from "process";
import * as fse from "fs-extra";

fse.ensureDirSync("build");
shell.cp("-R", process.argv[2], "build/");
// tslint:disable-next-line: no-console
console.log(`[copy-asset] Successfully copied ${process.argv[2]}`);
