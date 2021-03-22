import Log from "ts/lib/log";
import Game from "./Game";

export default class ChatBoot {
	// nvm still need this
	replyBook: Record<string, string> = {
		"hello": "Hello there.",
		"no-no": "I haven't the slightest what you just said.",
		"answer-to-world": "yo're mum",
		"bold-one": "You're a bold one",
		"chem": "Mazais jānītis pievienoja 100g trinitrotoluola osmija tetroksīdam. Kuras pakāpes apdegumus guva Mazais Jānītis?"
	}

	private game: Game;
	private curVerificationResolveCb: (response: string) => void;

	constructor(game: Game){
		this.game = game;
		this.game.socket.socketEvents.addListener("ChatbotVerifyAnswerResponse", (res: string) => { this.onAnswerVerified(res) });
	}

	async processMessage(msg: string): Promise<string> {
		this.requestAnswerVerification(msg);

		return new Promise<string>((res, rej) => {
			this.curVerificationResolveCb = res;
		});
	}

	private requestAnswerVerification(msg: string){
		this.game.socket.chatbotVerifyAnswer(msg);
	}

	private onAnswerVerified(msg: string){
		this.curVerificationResolveCb(this.interpretReply(msg));
	}

	interpretReply(rep: string) {
		if (this.replyBook[rep]) {
			return this.replyBook[rep];
		} else {
			Log.error("Unbound string: " + rep + ", this usually means that someone added it server-side but not client-side.");
			return "uh oh someond did an oopse";
		}
	}
}