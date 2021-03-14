import express, { Request, Response } from "express";
import path from "path";
import LobbyManager from "../LobbyManager";
import { logger } from "../index";
import Lobby from "../Lobby";

export default class Routes{
	router: express.Router;
	private baseDir: string;

	constructor(){
		this.router = express.Router();
		this.baseDir = path.join(__dirname, "..", "client");

		this.router.get("/", (req, res) => { this.index(req, res); });
		this.router.get("/join", (req, res) => { this.join(req, res); });
		this.router.get("/createLobby", (req, res) => { this.createLobby(req, res); });

		// Add the static file middleware, so custom routes have priority over the middleware
		this.router.use(express.static(path.join(__dirname, "..", "client")));
	}

	private index(req: Request, res: Response){
		res.sendFile(path.join(this.baseDir, "index.html"));
	}

	private join(req: Request, res: Response){
		res.cookie("lobby", decodeURIComponent(req.query.id.toString()));
		res.redirect("/");
	}

	private createLobby(req: Request, res: Response){
		const newLobby: Lobby = LobbyManager.createLobby();
		res.cookie("lobby", newLobby.id);
		res.redirect("/");
	}
}