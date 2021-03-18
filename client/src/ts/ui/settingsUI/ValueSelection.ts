import DynamicElement from "../DynamicElement";

type OnSelectCallback = (selection: string) => void;

export interface Selection{
	value: string,
	displayName: string
}

export default class GameModeSelection extends DynamicElement{
	private curSelection: string;
	private values: Selection[] = [];
	private title: string;
	onSelect: OnSelectCallback = () => {};

	protected get rawValue(){
		return this.curSelection;
	}

	constructor(containerSelector: string, title: string, values: Selection[]){
		super(containerSelector);
		this.values = values;
		this.title = title;
		this.curSelection = this.values[0].value;

		this.createBase();
	}

	protected createBase(){
		this.objectContainer = document.createElement("div");
		this.objectContainer.className = "selectionContainer";
		this.mainContainer.appendChild(this.objectContainer);

		const title = document.createElement("span");
		title.textContent = this.title;
		title.className = "settingsSubtitle";
		this.objectContainer.appendChild(title);

		for(const value of this.values){
			this.createButton(value);
		}
	}

	private createButton(val: Selection){
		const btn = document.createElement("button");
		btn.className = "button";
		btn.textContent = val.displayName;
		btn.setAttribute("data-gamemode", val.value);

		if(this.curSelection === val.value){
			btn.setAttribute("data-selected", "data-selected");
		}

		btn.addEventListener("click", (e) => { this.onBtnClick(e); })

		this.objectContainer.appendChild(btn);
	}

	private onBtnClick(e: Event){
		const target: HTMLElement = e.target as HTMLElement;

		if(target.hasAttribute("data-selected")) return;

		this.objectContainer.querySelector("[data-selected]").removeAttribute("data-selected");
		target.setAttribute("data-selected", "data-selected");

		this.curSelection = target.getAttribute("data-gamemode");
		this.onSelect(this.curSelection);
	}
}