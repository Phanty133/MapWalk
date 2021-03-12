import express, { Request, Response } from "express";
import path from "path";

export default class Routes{
	router: express.Router;

	constructor(){
		this.router = express.Router();
		this.router.use(express.static(path.join(__dirname, "..", "client")));

		this.router.get("/", this.index);
	}

	private index(req: Request, res: Response){
		res.sendFile(path.join(__dirname, "..", "client", "index.html"));
	}
}
