import express, { Response, Request } from "express";
import bcrypt from "bcrypt";
import { logger } from "./index";

export function checkLogin(req: Request, res: Response, next: () => void){
	if (req.cookies.user_sid && !req.session.user) {
		res.clearCookie('user_sid');
	}
	next();
}

export function validateSession(req: Request, res: Response, next: () => void){
	if ((req.session.user && req.cookies.user_sid) || process.env.USER_CHECKADMIN === "false") {
		next();
	} else {
		res.status(401).redirect("/");
	}
}

export async function loginHandler(req: Request, res: Response){
	const user = req.body.username;
	const pass = req.body.password;

	// Validate the credentials

	if(
		user === process.env.ADMIN_USER
		&& await bcrypt.compare(pass, process.env.ADMIN_PASSHASH)
	){
		req.session.user = user;
		res.status(200).redirect("/admin");
	}
	else{
		res.status(401).redirect("/");
	}
}

export function logoutHandler(req: Request, res: Response){
	res.clearCookie('user_sid');
	req.session.user = undefined;
	res.redirect("/");
}
