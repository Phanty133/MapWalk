import ChatBoot from "ts/game/ChatBoot";
import createElement from "ts/lib/createElement";
import Log from "ts/lib/log";

export function bindChatBoot(boot: ChatBoot) {
	document.getElementById("speech").addEventListener("keydown", (ev) => {
		if (ev.key === "Enter") {
			const val = (document.getElementById("speech") as HTMLInputElement).value;
			const resp = boot.processMessage(val);
			(document.getElementById("speech") as HTMLInputElement).value = "";
			const chatLog = document.getElementById("messages");
			// Why prepend? Because with the way CSS works atm, this'll make sure it works how I want it and save me time on stuff that'll get changed later anyways lol.
			chatLog.prepend(createElement("div", {
				textContent: "\n" + val,
				class: "playerMsg"
			}));
			chatLog.prepend(createElement("div", {
				textContent: "\n" + resp,
				class: "botMsg"
			}));
		}
	});
}

export function displayServerMsg(msg: string) {
	document.getElementById("messages").prepend(createElement("div", {
		textContent: "\n" + msg,
		class: "serverMsg"
	}));
}
