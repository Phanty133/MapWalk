import dotenv from "dotenv";
dotenv.config();

// Networking
import express, { Response, Request } from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import http, { Server } from "http";
import SocketServer from "./SocketServer";

// Other
import path from "path";
import Logger from "./Logger";
import Routes from "./routes/Routes";

// Initializations

export const logger = new Logger(process.env.LOG_DIR, parseInt(process.env.LOG_VERBOSITY, 10));
const port = process.env.SERVER_PORT;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, "client")));

// Routing

const routes = new Routes();
app.use(routes.router);

// Error logger configuration must be after every route definition
app.use((err: Error, req: Request, res: Response, next: () => void) => {
	logger.expressHandler(err, req, res, next); // Called in an anonymous function to preserve "this" for the method
});

const httpServer: Server = http.createServer(app);
httpServer.listen(port, () => {
	// tslint:disable-next-line: no-console
	console.log("Running server on port ", port);
});

export const socketServer = new SocketServer(httpServer);
