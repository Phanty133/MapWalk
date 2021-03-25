import createElement from "ts/lib/createElement";
import Socket, { ServerLobbyChatMessageData } from "ts/networking/Socket";
import LobbyUsers from "./LobbyUsers";

export default class LobbyChat{
	chatMessageContainer: HTMLDivElement;
	chatInput: HTMLInputElement;
	socket: Socket;
	users: LobbyUsers;

	constructor(socket: Socket, users: LobbyUsers){
		this.socket = socket;
		this.users = users;

		this.chatMessageContainer = document.getElementById("p2pChatMessages") as HTMLDivElement;
		this.chatInput = document.getElementById("p2pChatInput") as HTMLInputElement;

		this.bindEvents();
	}

	private bindEvents(){
		this.chatInput.addEventListener("keydown", (e: KeyboardEvent) => {
			if(e.key !== "Enter") return;

			if(this.chatInput.value.trim() !== ""){
				this.socket.serverLobbyChatMessage(this.chatInput.value);
				this.chatInput.value = "";
			}
		});

		this.socket.events.addListener("ServerLobbyChatMessage", (data: ServerLobbyChatMessageData) => {
			const colorSelectEl = this.users.getPlayerElement(data.authorSocketID).querySelector("[data-color]") as HTMLSelectElement;

			this.addMessage(data.username, data.content, colorSelectEl.value);
		});
	}

	addMessage(author: string, content: string, color: string){
		const msgContainer = createElement("span", { parent: this.chatMessageContainer });

		createElement("span", { parent: msgContainer, textContent: author, style: { color } });
		createElement("span", { parent: msgContainer, textContent: `: ${content}` });
	}

	addSystemMessage(content: string, color: string){
		const msgContainer = createElement("span", { parent: this.chatMessageContainer });
		createElement("span", { parent: msgContainer, textContent: content, style: { color } });
	}
}