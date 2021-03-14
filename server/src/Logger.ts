import e, { Request, Response } from "express";
import * as fse from "fs-extra";
import * as path from "path";

export default class Logger{
	private _dir:string;
	private _verbosity:number;
	private _logpath:string = null;

	errorMessages: Record<number, string> = { // Plain messages can also be replaced with error pages
		404: "404 PEBCAK",
		500: "500 Server done goofed"
	};

	constructor(logDir:string, verbosity:number){
		this._dir = logDir;
		this._verbosity = verbosity;

		if(process.env.NODE_ENV === "development"){
			this._createLogFile("dev");
			this.info("DEVELOPMENT");
		}
		else{
			this._createLogFile();
		}
	}

	private _createLogFile(filename?:string): void{
		if(filename === null){
			const curDate = new Date();
			const fileDate = `${curDate.getUTCDate()}-${curDate.getUTCMonth() + 1}-${curDate.getUTCFullYear()}T${curDate.getUTCHours()}:${curDate.getUTCMinutes()}`;
			this._logpath = path.join(this._dir, `${fileDate}.log`);
		}
		else{
			this._logpath = path.join(this._dir, `${filename}.log`);
		}

		fse.outputFileSync(this._logpath, `# MapWalk server\n# Version: ${process.env.VERSION}\n\n`);
	}

	private _writeToLog(msg: any): void{
		if(this._logpath === null){
			this._createLogFile();
		}

		const curDate = new Date();
		const logTime = curDate.toISOString();

		fse.appendFile(this._logpath, `${logTime} ${msg}\n`);
	}

	private _getCallSignature(): string{
		const callerLine = (new Error()).stack.split("\n")[3];
		const clean = callerLine.split(/server/)[1];
		return clean.substring(0, clean.length - 1);
	}

	private _parseMsg(msg: any){
		switch(typeof msg){
			case "string":
				return msg;
			case "object":
				return JSON.stringify(msg);
		}
	}

	info(_msg: any): void{
		let msg = this._parseMsg(_msg);

		if(process.env.LOG_TRACE === "true"){
			msg = `${this._getCallSignature()} ${msg}`;
		}

		if(this._verbosity === 2) this._writeToLog(`INFO ${msg}`);
	}

	warn(val: any | Error): void{
		if(this._verbosity < 1) return;

		if(val instanceof Error){
			let errMsg:string;

			if(process.env.LOG_TRACE === "true" && val.stack){
				errMsg = val.stack;
			}
			else{
				errMsg = val.toString();
			}

			this._writeToLog(`WARNING ${errMsg}`);
		}
		else{
			let msg = this._parseMsg(val);

			if(process.env.LOG_TRACE === "true"){
				msg = `${this._getCallSignature()} ${msg}`;
			}

			this._writeToLog(`WARNING ${msg}`);
		}
	}

	error(val: any | Error): void{
		if(val instanceof Error){
			let errMsg:string;

			if(process.env.LOG_TRACE === "true" && val.stack){
				errMsg = val.stack;
			}
			else{
				errMsg = val.toString();
			}

			this._writeToLog(`ERROR ${errMsg}`);
		}
		else{
			let msg = this._parseMsg(val);

			if(process.env.LOG_TRACE === "true"){
				msg = `${this._getCallSignature()} ${msg}`;
			}

			this._writeToLog(`ERROR ${msg}`);
		}
	}

	expressHandler(err: Error, req: Request, res: Response, next: () => void){
		res.status(500).send(this.errorMessages[500]);

		let errMsg:string;

		if(process.env.LOG_TRACE === "true" && err.stack){
			errMsg = err.stack;
		}
		else{
			errMsg = err.toString();
		}

		if(process.env.LOG_ERRCONTEXT === "true"){
			errMsg += `\n    [CONTEXT]\n`;
			errMsg += `        [Route]\n`;
			errMsg += `            ${req.originalUrl}\n`;
			errMsg += `        [Body]\n`;
			errMsg += `            ${JSON.stringify(req.body)}\n`;
			errMsg += `        [Cookies]\n`;
			errMsg += `            ${JSON.stringify(req.cookies)}`;
		}

		this.error(errMsg);
	}
}