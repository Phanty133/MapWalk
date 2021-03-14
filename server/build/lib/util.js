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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.genHexString = exports.getExtensionByFilename = exports.deleteSimilarFiles = exports.parseBool = void 0;
const fse = __importStar(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
function parseBool(str) {
    return JSON.parse(str.toLowerCase());
}
exports.parseBool = parseBool;
// Delete files with same name, different extension in specified directory
function deleteSimilarFiles(dir, fileName, excludeType = "") {
    return new Promise((res, rej) => {
        const dirFiles = fse.readdirSync(dir);
        const similarFiles = dirFiles.filter(el => el.startsWith(fileName));
        const promiseArr = [];
        let cnt = 0;
        for (const file of similarFiles) {
            if (path_1.default.extname(file) === excludeType)
                continue;
            promiseArr.push(fse.remove(path_1.default.join(dir, file)));
            cnt++;
        }
        Promise.all(promiseArr)
            .then(() => {
            res(cnt);
        })
            .catch((err) => {
            rej(err);
        });
    });
}
exports.deleteSimilarFiles = deleteSimilarFiles;
function getExtensionByFilename(dir, nameMatch) {
    const dirFiles = fse.readdirSync(dir);
    const match = dirFiles.find(el => el.match(new RegExp(`${nameMatch}\\.`)));
    if (match) {
        return path_1.default.extname(match);
    }
    return "";
}
exports.getExtensionByFilename = getExtensionByFilename;
function genHexString(len) {
    const buffer = crypto_1.default.randomBytes(len / 2);
    return buffer.toString("hex");
}
exports.genHexString = genHexString;
//# sourceMappingURL=util.js.map