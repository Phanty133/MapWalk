import Time from "ts/game/Time";
import Log from "ts/lib/log";
import ChatMessage, { MessageData } from "./ChatMessage";

export default class Chat{
	static inputStateCooldown: number = 100;
	private chatInput: HTMLInputElement;
	private chatMessageContainer: HTMLDivElement;
	private inputVisible: boolean = false;
	private inputStateCooldown: boolean = false;
	private messages: ChatMessage[] = [];

	constructor(){
		this.chatInput = document.getElementById("chatInput") as HTMLInputElement;
		this.chatMessageContainer = document.getElementById("chatMessageContainer") as HTMLDivElement;

		this.bindEvents();
		Time.bindToFrame(() => { this.onFrame(); });
	}

	private bindEvents(){
		document.addEventListener("keydown", (e: KeyboardEvent) => {
			if(e.key === "Enter"){
				if(this.inputVisible || this.inputStateCooldown) return;

				this.openInput();
				this.inputStateCooldown = true;

				setTimeout(() => { this.inputStateCooldown = false; }, Chat.inputStateCooldown);
			}
		});

		this.chatInput.addEventListener("keydown", (e: KeyboardEvent) => {
			if(e.key !== "Enter") return;
			if(!this.inputVisible || this.inputStateCooldown) return;

			if(this.chatInput.value !== ""){
				this.sendMessage(this.chatInput.value);
			}

			this.closeInput();
			this.inputStateCooldown = true;

			setTimeout(() => { this.inputStateCooldown = false; }, Chat.inputStateCooldown);
		});
	}

	sendMessage(text: string){
		// to be used for transmission when that's done
		this.addMessage({ content: text, author: "1337h4ck3rm4n", authorColor: "#FFAA00" });
	}

	addMessage(data: MessageData){
		this.messages.push(new ChatMessage(this.chatMessageContainer, data));
		const i = this.messages.length - 1;

		setTimeout(() => {
			this.messages[i].kill();
			delete this.messages[i];
		}, ChatMessage.timeTillFade + ChatMessage.fadeTime);
	}

	openInput(){
		this.chatInput.style.display = "block";
		this.chatInput.focus();
		this.inputVisible = true;
	}

	closeInput(){
		this.chatInput.style.display = "none";
		this.chatInput.value = "";
		this.inputVisible = false;
	}

	private onFrame(){
		if(this.messages.length === 0) return;

		for(const msg of this.messages.filter(msg => msg.fade)){
			msg.onFrame();
		}
	}
}