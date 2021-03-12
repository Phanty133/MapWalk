"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Networking
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
// Other
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("./logger"));
const routes_1 = __importDefault(require("./routes/routes"));
// Initializations
exports.logger = new logger_1.default(process.env.LOG_DIR, parseInt(process.env.LOG_VERBOSITY, 10));
const port = process.env.SERVER_PORT;
const app = express_1.default();
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.use(cookie_parser_1.default());
// app.use(session({
// 	secret: process.env.USER_SECRET,
// 	resave: parseBool(process.env.USER_RESAVE),
// 	saveUninitialized: parseBool(process.env.USER_SAVE_UNINIT),
// 	rolling: parseBool(process.env.USER_ROLLING),
// 	name: "user_sid",
// 	cookie: {
// 		maxAge: parseInt(process.env.USER_MAXAGE, 10),
// 		secure: parseBool(process.env.USER_SECURE)
// 	}
// }));
app.use(express_1.default.static(path_1.default.join(__dirname, "client")));
// Routing
const routes = new routes_1.default();
app.use(routes.router);
// Error logger configuration must be after every route definition
app.use((err, req, res, next) => {
    exports.logger.expressHandler(err, req, res, next); // Called in an anonymous function to preserve "this" for the method
});
// Start the express server
app.listen(port, () => {
    // tslint:disable-next-line:no-console
    console.log(`Server started at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map