import createElement from "ts/lib/createElement";
import DynamicElement from "../DynamicElement";

export default class VoiceSelection extends DynamicElement{
	public onChange: () => void = () => { };
	private inputEl: HTMLInputElement;

	public get value(): boolean{
		return this.inputEl.checked;
	}

	constructor(container: string | HTMLElement){
		super(container);

		this.createBase();
	}

	protected createBase(){
		this.objectContainer = createElement("div", { parent: this.mainContainer, class: "voiceSelection" });

		this.inputEl = createElement("input", { parent: this.objectContainer, attr: { type: "checkbox", checked: "checked" } }) as HTMLInputElement;
		createElement("span", { parent: this.objectContainer, textContent: "Voice communication" });

		this.inputEl.addEventListener("change", () => { this.onChange(); });
	}

	setDisabled(disabled: boolean = true){
		this.inputEl.disabled = disabled;
	}

	setValue(checked: boolean){
		this.inputEl.checked = checked;
	}
}