interface Session {
	user?:string
}

declare namespace Express {
	interface Request extends Express.Request{
		session: Session
	}
}