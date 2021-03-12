import dotenv from "dotenv";
dotenv.config();

// Networking
import express, { Response, Request } from "express";
import cookieParser from "cookie-parser";
import session from "express-session";

// Other
import path from "path";
import Logger from "./logger";
import { parseBool } from "./lib/util";
import Routes from "./routes/routes";

// Initializations

export const logger = new Logger(process.env.LOG_DIR, parseInt(process.env.LOG_VERBOSITY, 10));
const port = process.env.SERVER_PORT;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
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

app.use(express.static(path.join(__dirname, "client")));

// Routing

const routes = new Routes();
app.use(routes.router);

// Error logger configuration must be after every route definition
app.use((err: Error, req: Request, res: Response, next: () => void) => {
	logger.expressHandler(err, req, res, next); // Called in an anonymous function to preserve "this" for the method
});

// Start the express server
app.listen(port, () => {
	// tslint:disable-next-line:no-console
	console.log(`Server started at http://localhost:${port}`);
});
