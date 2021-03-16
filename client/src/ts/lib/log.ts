export class Log {

	static log(msg: any) {
		// \/ when tslint is dumb as fuck
		// tslint:disable-next-line: no-console
		console.table(msg);
	}
}