import dotenv from "dotenv";
dotenv.config();

// Networking
import express, { Response, Request } from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import http, { Server } from "http";
import https from "https";
import SocketServer from "./SocketServer";
import { secureRouter } from "./routes/SecureRouter";

// Other
import path from "path";
import Logger from "./Logger";
import Routes from "./routes/Routes";
import ChatBoot from "./ChatBoot";
import MapObjectLoader from "./MapObjectLoader";
import fs from "fs";
import { parseBool } from "./lib/util";
// Initializations

export const logger = new Logger(process.env.LOG_DIR, parseInt(process.env.LOG_VERBOSITY, 10));
const port = process.env.SERVER_PORT;

let key: string;
let cert: string;

if(process.env.NODE_ENV === "production"){
	const certPath = `/etc/letsencrypt/live/mapwalk.tk`;
	key = fs.readFileSync(path.join(certPath, "privkey.pem")).toString();
	cert = fs.readFileSync(path.join(certPath, "fullchain.pem")).toString();
}

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, "client")));

app.use(session({
	secret: process.env.USER_SECRET,
	resave: parseBool(process.env.USER_RESAVE),
	saveUninitialized: parseBool(process.env.USER_SAVE_UNINIT),
	rolling: parseBool(process.env.USER_ROLLING),
	name: "user_sid",
	cookie: {
		maxAge: parseInt(process.env.USER_MAXAGE, 10),
		secure: parseBool(process.env.USER_SECURE)
	}
}));

// Routing

export const mapObjectLoader = new MapObjectLoader();
mapObjectLoader.loadObjects(); // Async

// app.use("/admin", secureRouter);

const routes = new Routes();
app.use(routes.router);

// Error logger configuration must be after every route definition
app.use((err: Error, req: Request, res: Response, next: () => void) => {
	logger.expressHandler(err, req, res, next); // Called in an anonymous function to preserve "this" for the method
});

let server: Server;

if(process.env.NODE_ENV === "production"){
	server = https.createServer({key, cert}, app);

	server.listen(port, () => {
		// tslint:disable-next-line: no-console
		console.log("Running server on port ", port);
	});

	const httpServer = express();

	httpServer.get("*", (req, res) => {
		res.redirect('https://' + req.headers.host + req.url);
	});

	httpServer.listen(80);
}
else{
	server = http.createServer(app);

	server.listen(port, () => {
		// tslint:disable-next-line: no-console
		console.log("Running server on " + port);
	});
}

export const socketServer = new SocketServer(server);
export const chatBoot = new ChatBoot();
