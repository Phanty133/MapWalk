import ChatBoot from "ts/game/ChatBoot";
import createElement from "ts/lib/createElement";
import Log from "ts/lib/log";

export function bindChatBoot(boot: ChatBoot) {
	document.getElementById("speech").addEventListener("keydown", (ev) => {
		if (ev.key === "Enter") {
			const val = (document.getElementById("speech") as HTMLInputElement).value;
			(document.getElementById("speech") as HTMLInputElement).disabled = true;
			(document.getElementById("speech") as HTMLInputElement).value = "";
			const chatLog = document.getElementById("messages");
			// Why prepend? Because with the way CSS works atm, this'll make sure it works how I want it and save me time on stuff that'll get changed later anyways lol.
			chatLog.prepend(createElement("div", {
				textContent: "\n" + val,
				class: "playerMsg"
			}));
			boot.processMessage(val).then((resp) => {
				chatLog.prepend(createElement("div", {
					textContent: "\n" + resp,
					class: "botMsg"
				}));
				(document.getElementById("speech") as HTMLInputElement).disabled = false;
			});
		}
	});
}

export enum persons {
	SERVER,
	BOT,
	PLAYER
}

export function displayMsg(msg: string, person: persons = persons.SERVER) {
	let classy = "serverMsg";
	switch (person) {
		case persons.SERVER:
			classy = "serverMsg";
			break;
		case persons.BOT:
			classy = "botMsg";
			break;
		case persons.PLAYER:
			classy = "playerMsg";
			break;
		default:
			classy = "serverMsg";
			break;
	}
	document.getElementById("messages").prepend(createElement("div", {
		textContent: "\n" + msg,
		class: classy
	}));
}
