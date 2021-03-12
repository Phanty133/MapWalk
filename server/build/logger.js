"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fse = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
class Logger {
    constructor(logDir, verbosity) {
        this._logpath = null;
        this.errorMessages = {
            404: "404 PEBCAK",
            500: "500 Server done goofed"
        };
        this._dir = logDir;
        this._verbosity = verbosity;
        if (process.env.NODE_ENV === "development") {
            this._createLogFile("dev");
            this.info("DEVELOPMENT");
        }
        else {
            this._createLogFile();
        }
    }
    _createLogFile(filename) {
        if (filename === null) {
            const curDate = new Date();
            const fileDate = `${curDate.getUTCDate()}-${curDate.getUTCMonth() + 1}-${curDate.getUTCFullYear()}T${curDate.getUTCHours()}:${curDate.getUTCMinutes()}`;
            this._logpath = path.join(this._dir, `${fileDate}.log`);
        }
        else {
            this._logpath = path.join(this._dir, `${filename}.log`);
        }
        fse.outputFileSync(this._logpath, `# MapWalk server\n# Version: ${process.env.VERSION}\n\n`);
    }
    _writeToLog(msg) {
        if (this._logpath === null) {
            this._createLogFile();
        }
        const curDate = new Date();
        const logTime = curDate.toISOString();
        fse.appendFile(this._logpath, `${logTime} ${msg}\n`);
    }
    info(msg) {
        if (this._verbosity === 2)
            this._writeToLog(`INFO ${msg}`);
    }
    warn(val) {
        if (this._verbosity < 1)
            return;
        if (val instanceof Error) {
            let errMsg;
            if (process.env.LOG_TRACE === "true" && val.stack) {
                errMsg = val.stack;
            }
            else {
                errMsg = val.toString();
            }
            this._writeToLog(`WARNING ${errMsg}`);
        }
        else {
            this._writeToLog(`WARNING ${val}`);
        }
    }
    error(val) {
        if (val instanceof Error) {
            let errMsg;
            if (process.env.LOG_TRACE === "true" && val.stack) {
                errMsg = val.stack;
            }
            else {
                errMsg = val.toString();
            }
            this._writeToLog(`ERROR ${errMsg}`);
        }
        else {
            this._writeToLog(`ERROR ${val}`);
        }
    }
    expressHandler(err, req, res, next) {
        res.status(500).send(this.errorMessages[500]);
        let errMsg;
        if (process.env.LOG_TRACE === "true" && err.stack) {
            errMsg = err.stack;
        }
        else {
            errMsg = err.toString();
        }
        if (process.env.LOG_ERRCONTEXT === "true") {
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
exports.default = Logger;
//# sourceMappingURL=logger.js.map