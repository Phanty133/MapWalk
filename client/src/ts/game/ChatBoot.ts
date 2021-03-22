import Log from "ts/lib/log";
import { displayMsg, persons } from "ts/ui/gameui/ChatbotUI";
import Game from "./Game";

export default class ChatBoot {
	// nvm still need this
	replyBook: Record<string, string> = {
		"hello": "Hello there.",
		"no-no": "I haven't the slightest what you just said.",
		"answer-to-world": "yo're mum",
		"bold-one": "You're a bold one",
		"chem": "Mazais jānītis pievienoja 100g trinitrotoluola osmija tetroksīdam. Kuras pakāpes apdegumus guva Mazais Jānītis?",
		"correct": "Yep, checks out."
	}

	private game: Game;
	private curVerificationResolveCb: (response: string) => void;
	private currentQ: string;

	constructor(game: Game) {
		this.game = game;
		this.game.socket.socketEvents.addListener("ChatbotVerifyAnswerResponse", (res: string) => { this.onAnswerVerified(res) });
	}

	async processMessage(msg: string): Promise<string> {
		this.requestAnswerVerification(msg);

		return new Promise<string>((res, rej) => {
			this.curVerificationResolveCb = res;
		});
	}

	askQuestion(q: string) {
		this.currentQ = q;
		displayMsg(q, persons.BOT);
	}

	invalidateQuestion() {
		this.currentQ = null;
	}

	correctQuestion() {
		this.invalidateQuestion();
		this.game.map.activeObject.onCorrectAnswer();
	}

	incorrectQuestion() {
		// this.invalidateQuestion(); -- Actually, I am unsure if I am supposed to discard the question on an incorrect answer
		this.game.map.activeObject.onIncorrectAnswer();
	}

	private requestAnswerVerification(msg: string) {
		this.game.socket.chatbotVerifyAnswer(msg);
	}

	private onAnswerVerified(msg: string) {
		this.curVerificationResolveCb(this.interpretReply(msg));
	}

	interpretReply(rep: string) {
		if (this.replyBook[rep]) {
			if (this.currentQ) {
				if (this.currentQ === this.replyBook[rep] || rep === "correct") {
					this.correctQuestion();
					return "Correct!";
				} else {
					this.incorrectQuestion();
					return "That was wrong.";
				}
			}
			return this.replyBook[rep];
		} else {
			if (this.currentQ) {
				this.incorrectQuestion();
				return "That was wrong.";
			}
			Log.error("Unbound string: " + rep + ", this usually means that someone added it server-side but not client-side.");
			return "uh oh someond did an oopse";
		}
	}
}