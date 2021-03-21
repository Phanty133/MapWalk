import Time from "ts/game/Time";
import createElement from "ts/lib/createElement";
import Log from "ts/lib/log";
import DynamicElement from "../DynamicElement";

export interface MessageData{
	content: string,
	author: string,
	authorColor: string
}

export default class ChatMessage extends DynamicElement{
	static timeTillFade: number = 5000; // Time till fade
	static fadeTime: number = 500; // Fade time
	private data: MessageData;
	private timeSinceFadeStart: number = 0;
	public fade = false;

	constructor(container: HTMLDivElement | string, message: MessageData){
		super(container);

		this.data = message;
		this.createBase();

		setTimeout(() => {
			this.fade = true;
		}, ChatMessage.timeTillFade);
	}

	protected createBase(){
		this.objectContainer = createElement("span");
		this.mainContainer.appendChild(this.objectContainer);

		createElement("span", {
			textContent: this.data.author,
			style: {
				color: this.data.authorColor
			},
			parent: this.objectContainer
		});

		createElement("span", {
			textContent: `: ${this.data.content}`,
			parent: this.objectContainer
		});
	}

	onFrame(){ // Will be called from a Chat instance
		this.timeSinceFadeStart += Time.deltaTime;

		const opacityValue = 1 - this.timeSinceFadeStart / ChatMessage.fadeTime;
		this.objectContainer.style.opacity = opacityValue.toString();
	}

	kill(){
		this.objectContainer.remove();
	}
}
