"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketServer = exports.logger = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Networking
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_1 = __importDefault(require("http"));
const SocketServer_1 = __importDefault(require("./SocketServer"));
const Logger_1 = __importDefault(require("./Logger"));
const Routes_1 = __importDefault(require("./routes/Routes"));
// Initializations
exports.logger = new Logger_1.default(process.env.LOG_DIR, parseInt(process.env.LOG_VERBOSITY, 10));
const port = process.env.SERVER_PORT;
const app = express_1.default();
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.use(cookie_parser_1.default());
// app.use(express.static(path.join(__dirname, "client")));
// Routing
const routes = new Routes_1.default();
app.use(routes.router);
// Error logger configuration must be after every route definition
app.use((err, req, res, next) => {
    exports.logger.expressHandler(err, req, res, next); // Called in an anonymous function to preserve "this" for the method
});
const httpServer = http_1.default.createServer(app);
httpServer.listen(port, () => {
    // tslint:disable-next-line: no-console
    console.log("Running server on port ", port);
});
exports.socketServer = new SocketServer_1.default(httpServer);
//# sourceMappingURL=index.js.map