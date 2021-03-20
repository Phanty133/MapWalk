import express, { Request, Response } from "express";
import path from "path";
import LobbyManager from "../LobbyManager";
import { logger } from "../index";
import Lobby from "../Lobby";
import fse from "fs-extra";
import { randomArrayElements } from "../lib/util";

interface ObjectData{
	name: string;
	description: string;
	image: string;
	location: {x: number, y: number};
};

export default class Routes{
	router: express.Router;
	private baseDir: string;
	private dataDir: string;
	private objectData: ObjectData[];

	constructor(){
		this.router = express.Router();
		this.baseDir = path.join(__dirname, "..", "client");
		this.dataDir = path.join(__dirname, "..", "..", "data");

		this.router.get("/", (req, res) => { this.index(req, res); });
		this.router.get("/game", (req, res) => { this.game(req, res); })
		this.router.get("/join", (req, res) => { this.join(req, res); });
		this.router.get("/createLobby", (req, res) => { this.createLobby(req, res); });
		this.router.get("/objects", (req, res) => { this.objects(req, res); });

		// Add the static file middleware, so custom routes have priority over the middleware
		this.router.use(express.static(this.baseDir));

		this.loadObjects();
	}

	private async loadObjects(){
		this.objectData = await fse.readJSON(path.join(this.dataDir, "objects-full.json"));
	}

	private index(req: Request, res: Response){
		res.sendFile(path.join(this.baseDir, "index.html"));
	}

	private game(req: Request, res: Response){
		res.sendFile(path.join(this.baseDir, "game.html"));
	}

	private join(req: Request, res: Response){
		const lobbyID = decodeURIComponent(req.query.id.toString());

		if(!(lobbyID in LobbyManager.lobbies)){
			res.sendStatus(400);
		}
		else{
			res.cookie("lobby", lobbyID);
			res.redirect("/game");
		}
	}

	private createLobby(req: Request, res: Response){
		const newLobby: Lobby = LobbyManager.createLobby();
		res.cookie("lobby", newLobby.id);
		res.redirect("/game");
	}

	private objects(req: Request, res: Response){
		let objCount: number;

		if(!req.query.count) {
			objCount = 1;
		}
		else{
			objCount = parseInt(req.query.count.toString(), 10);
		}

		const randElements = randomArrayElements(this.objectData, objCount);

		res.json(randElements);
	}
}
