import Log from "ts/lib/log";

export default class ChatBoot {
	// nvm still need this
	replyBook: Record<string, string> = {
		"hello": "Hello there.",
		"no-no": "I haven't the slightest what you just said.",
		"answer-to-world": "yo're mum",
		"bold-one": "You're a bold one",
		"chem": "Mazais jānītis pievienoja 100g trinitrotoluola osmija tetroksīdam. Kuras pakāpes apdegumus guva Mazais Jānītis?"
	}

	async processMessage(msg: string) {
		const resp = await fetch('/askChatbot?question=' + msg);
		const out = await resp.json();
		return this.interpretReply(out.answer);
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