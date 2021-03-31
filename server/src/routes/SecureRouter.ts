import express, { Request, Response } from "express";
import { validateSession, checkLogin } from "../userauth";
import path from "path";

export const secureRouter = express.Router();

const baseDir = path.join(__dirname, "..", "client");

secureRouter.use(validateSession);
secureRouter.use(checkLogin);
secureRouter.use(express.static(baseDir));

secureRouter.get("/", (req, res) => {
	res.sendFile(path.join(baseDir, "adminpanel.html"));
});
