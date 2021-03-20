import DynamicElement from "../DynamicElement";

export default class ObjectSelection extends DynamicElement{
	private objectCountEl: HTMLElement;
	private inputEl: HTMLInputElement;
	private defaults = {
		value: 15,
		min: 5,
		max: 45
	};

	public get value(): number{
		return parseInt(this.inputEl.value, 10);
	}

	constructor(containerSelector: string){
		super(containerSelector);

		this.createBase();
	}

	protected createBase(){
		this.objectContainer = document.createElement("div");
		this.objectContainer.className = "objectSelection";
		this.mainContainer.appendChild(this.objectContainer);

		const title = document.createElement("span");
		title.textContent = "Object count";
		title.className = "settingsSubtitle";
		this.objectContainer.appendChild(title);

		this.inputEl = document.createElement("input");
		this.inputEl.type = "range";
		this.inputEl.min = this.defaults.min.toString();
		this.inputEl.max = this.defaults.max.toString();
		this.inputEl.value = this.defaults.value.toString();
		this.inputEl.addEventListener("input", (e) => { this.onInputHandler(e); })
		this.objectContainer.appendChild(this.inputEl);

		const text = document.createElement("span");
		text.textContent = "Objects: ";
		this.objectContainer.appendChild(text);

		this.objectCountEl = document.createElement("span");
		this.objectCountEl.textContent = this.defaults.value.toString();
		text.appendChild(this.objectCountEl);
	}

	private onInputHandler(e: Event){
		this.objectCountEl.textContent = this.inputEl.value;
	}
}