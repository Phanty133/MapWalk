import ChatBoot from "ts/game/ChatBoot";
import Game from "ts/game/Game";
import createElement from "ts/lib/createElement";
import Log from "ts/lib/log";

export default class ChatBotUI {
	private game: Game;
	private container: HTMLElement;
	private _active: boolean = false;

	public get active(): boolean {
		return this._active;
	}

	constructor(game: Game) {
		this.game = game;
		this.container = document.getElementById("chatZoneContainer");

		this.bindEvents();
	}

	private bindEvents() {
		document.getElementById("speech").addEventListener("keydown", (ev) => {
			if (ev.key === "Enter") {
				ev.preventDefault();

				const val = (document.getElementById("speech") as HTMLInputElement).value;
				(document.getElementById("speech") as HTMLInputElement).disabled = true;
				(document.getElementById("speech") as HTMLInputElement).value = "";
				const chatLog = document.getElementById("messages");

				// Why prepend? Because with the way CSS works atm, this'll make sure it works how I want it and save me time on stuff that'll get changed later anyways lol.
				chatLog.prepend(createElement("div", {
					textContent: "\n" + val,
					class: "playerMsg"
				}));

				this.game.chatBot.processMessage(val).then((resp) => {
					chatLog.prepend(createElement("div", {
						textContent: "\n" + resp,
						class: "botMsg"
					}));
					(document.getElementById("speech") as HTMLInputElement).disabled = false;
				});
			}
		});
	}

	open() {
		if (this.active) return;

		this._active = true;
		this.container.style.display = "block";
	}

	close() {
		if (!this.active) return;

		this._active = false;
		this.container.style.display = "none";
		this.container.querySelector("#messages").innerHTML = "";
	}
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
