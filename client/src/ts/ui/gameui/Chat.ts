import Time from "ts/game/Time";
import Log from "ts/lib/log";
import ChatMessage, { ChatMessageData } from "./ChatMessage";
import { MessageData } from "ts/networking/P2PLobby";
import * as L from "leaflet";
import Game from "ts/game/Game";

export default class Chat{
	static inputStateCooldown: number = 100;
	private chatInput: HTMLInputElement;
	private chatMessageContainer: HTMLDivElement;
	private inputVisible: boolean = false;
	private inputStateCooldown: boolean = false;
	private messages: ChatMessage[] = [];
	private game: Game;
	private aiInput: HTMLInputElement;

	constructor(game: Game){
		this.game = game;

		this.aiInput = document.getElementById("speech") as HTMLInputElement;
		this.chatInput = document.getElementById("chatInput") as HTMLInputElement;
		this.chatMessageContainer = document.getElementById("chatMessageContainer") as HTMLDivElement;

		this.bindEvents();
		Time.bindToFrame(() => { this.onFrame(); });

		L.DomEvent.disableClickPropagation(this.chatInput);
	}

	private bindEvents(){
		document.addEventListener("keydown", (e: KeyboardEvent) => {
			if(e.key !== "Enter") return;
			if(this.aiInput === document.activeElement) return;
			if(this.inputStateCooldown) return;

			if(this.inputVisible){
				if(this.chatInput.value.trim() !== ""){
					this.sendMessage(this.chatInput.value);
				}

				this.closeInput();
			}
			else{
				this.openInput();
			}

			this.inputStateCooldown = true;
			setTimeout(() => { this.inputStateCooldown = false; }, Chat.inputStateCooldown);
		});

		if(this.game.isMultiplayer){
			this.game.p2p.bindToChannel("ChatMessage", (data: MessageData.ChatMessage) => {
				const senderData = this.game.playersByID[data.peer].info.plyrData;
				const chatMsgData: ChatMessageData = {
					content: data.content,
					author: senderData.username,
					authorColor: senderData.color ? senderData.color : "#FFAA00"
				};

				this.addMessage(chatMsgData);
			});
		}
	}

	sendMessage(text: string){
		if(this.game.isMultiplayer){
			const localPlayerInfo = this.game.localPlayer.info;

			this.game.p2p.broadcast({
				cmd: "ChatMessage",
				content: text,
				authorSocketID: localPlayerInfo.socketID
			});

			this.addMessage({
				content: text,
				author: localPlayerInfo.plyrData.username,
				authorColor: localPlayerInfo.plyrData.color ? localPlayerInfo.plyrData.color : "#FFAA00"
			});
		}
		else{
			this.addMessage({
				content: text,
				author: "LocalPlayer",
				authorColor: "#FFAA00"
			});
		}
	}

	addMessage(data: ChatMessageData){
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