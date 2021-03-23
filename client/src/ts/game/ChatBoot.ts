import Log from "ts/lib/log";
import { displayMsg, persons } from "ts/ui/gameui/ChatbotUI";
import Game from "./Game";
import GameEvent, { QuestionAnswerEventData } from "./GameEvent";
import { GameEventData } from "./GameEventHandler";

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
	private currentAnswer: string = null;

	constructor(game: Game) {
		this.game = game;
		this.game.socket.events.addListener("ChatbotVerifyAnswerResponse", (res: string) => { this.onAnswerVerified(res) });

		if(this.game.isMultiplayer){
			this.game.eventHandler.on("QuestionAnswer", (e: GameEventData) => {
				if(e.success){
					if(!e.foreign){
						this.curVerificationResolveCb(this.interpretReply(e.event.data.response));
					}
					else{
						const targetObj = this.game.map.objectsByID[e.event.data.objectID];

						if(e.event.data.response === "correct"){
							targetObj.onCorrectAnswer(e.origin);
						}
						else{
							targetObj.onIncorrectAnswer(e.origin);
						}
					}
				}
				else{
					this.curVerificationResolveCb(this.interpretReply(null)); // If the other players don't get the same response, assume the answer as incorrect?
				}
			});

			this.game.p2pEventHandler.eventVerifiers.QuestionAnswer = async () => {
				return true;
			};
		}
	}

	async processMessage(msg: string): Promise<string> {
		if(this.currentAnswer !== null) return;

		this.requestAnswerVerification(msg);
		this.currentAnswer = msg;

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

	private correctQuestion(id?: number) {
		this.invalidateQuestion();

		if(id){
			this.game.map.objectsByID[id].onCorrectAnswer();
		}
		else{
			this.game.map.activeObject.onCorrectAnswer();
		}
	}

	private incorrectQuestion(id?: number) {
		// this.invalidateQuestion(); -- Actually, I am unsure if I am supposed to discard the question on an incorrect answer

		if(id){
			this.game.map.objectsByID[id].onIncorrectAnswer();
		}
		else{
			this.game.map.activeObject.onIncorrectAnswer();
		}
	}

	private requestAnswerVerification(msg: string) {
		this.game.socket.chatbotVerifyAnswer(msg);
	}

	private onAnswerVerified(msg: string) {
		if(this.game.isMultiplayer){
			const ansEvData: QuestionAnswerEventData = {
				response: msg,
				answer: this.currentAnswer,
				objectID: this.game.map.activeObject.id
			};

			this.game.eventHandler.dispatchEvent(new GameEvent("QuestionAnswer", ansEvData));
		}
		else{
			this.curVerificationResolveCb(this.interpretReply(msg));
		}
	}

	interpretReply(rep: string) {
		this.currentAnswer = null;

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
		}
		else if(rep === null){
			return "Something went wrong. Try again."
		}
		else {
			if (this.currentQ) {
				this.incorrectQuestion();
				return "That was wrong.";
			}
			Log.error("Unbound string: " + rep + ", this usually means that someone added it server-side but not client-side.");
			return "uh oh someond did an oopse";
		}
	}
}