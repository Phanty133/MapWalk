"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
class Routes {
    constructor() {
        this.router = express_1.default.Router();
        this.router.use(express_1.default.static(path_1.default.join(__dirname, "..", "client")));
        this.router.get("/", this.index);
    }
    index(req, res) {
        res.sendFile(path_1.default.join(__dirname, "..", "client", "index.html"));
    }
}
exports.default = Routes;
//# sourceMappingURL=routes.js.map