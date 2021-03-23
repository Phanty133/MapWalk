import express, { Request, Response } from "express";
import path from "path";
import LobbyManager from "../LobbyManager";
import { logger, mapObjectLoader } from "../index";
import Lobby from "../Lobby";
import { randomArrayElements } from "../lib/util";
import ChatBoot from "../ChatBoot";

export default class Routes {
	router: express.Router;
	private baseDir: string;
	private dataDir: string;

	private chatBoot: ChatBoot;

	constructor() {
		this.router = express.Router();
		this.baseDir = path.join(__dirname, "..", "client");
		this.dataDir = path.join(__dirname, "..", "..", "data");

		this.router.get("/", (req, res) => { this.index(req, res); });
		this.router.get("/game", (req, res) => { this.game(req, res); })
		this.router.get("/join", (req, res) => { this.join(req, res); });
		this.router.get("/createLobby", (req, res) => { this.createLobby(req, res); });
		this.router.post("/objects", (req, res) => { this.objects(req, res); });

		// Add the static file middleware, so custom routes have priority over the middleware
		this.router.use(express.static(this.baseDir));
	}

	private index(req: Request, res: Response) {
		res.sendFile(path.join(this.baseDir, "index.html"));
	}

	private game(req: Request, res: Response) {
		res.sendFile(path.join(this.baseDir, "game.html"));
	}

	private join(req: Request, res: Response) {
		const lobbyID = decodeURIComponent(req.query.id.toString());

		if (!(lobbyID in LobbyManager.lobbies)) {
			res.sendStatus(400);
		}
		else {
			res.cookie("lobby", lobbyID);
			res.redirect("/game?mode=mp");
		}
	}

	private createLobby(req: Request, res: Response) {
		const newLobby: Lobby = LobbyManager.createLobby();
		res.cookie("lobby", newLobby.id);
		res.redirect("/game?mode=mp");
	}

	private objects(req: Request, res: Response) {
		let objCount: number;

		if (!req.body.count) {
			objCount = 1;
		}
		else {
			objCount = parseInt(req.body.count.toString(), 10);
		}

		res.json(mapObjectLoader.getRandomObjects(objCount));
	}
}
