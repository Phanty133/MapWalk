import Log from "ts/lib/log";

export default class ChatBoot {
	constructor() {
		// stuff
	}

	processMessage(text: string): string {
		Log.log("when " + text);
		return "big chungus";
	}
}