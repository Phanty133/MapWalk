export default class Log {
	static log(msg: any) {
		// \/ when tslint is dumb as fuck
		// tslint:disable-next-line: no-console
		console.table(msg);
	}

	static error(...msg: any[]){
		// tslint:disable-next-line: no-console
		console.error(msg.join(""));
	}
}