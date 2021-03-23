import createElement from "ts/lib/createElement";
import Log from "ts/lib/log";
import DynamicElement from "../DynamicElement";
import { Color } from "ts/lib/Color";
import { EventEmitter } from "events";

export default class ColorSelect extends DynamicElement{
	static colors: string[] = [
		"#d50000",
		"#aa00ff",
		"#6200ea",
		"#2962ff",
		"#0091ea",
		"#00b8d4",
		"#00c853",
		"#ffd600",
	];

	private disabled: boolean;
	private prevColor: string;
	public events: EventEmitter = new EventEmitter();

	public get el(){
		return this.objectContainer;
	}

	constructor(container: string | HTMLElement, disabled: boolean = true, defaultColor = ColorSelect.colors[0]){
		super(container);
		this.disabled = disabled;

		this.createBase(defaultColor);
	}

	protected createBase(defaultColor: string = ColorSelect.colors[0]){
		this.objectContainer = createElement("select", {
			class: "colorSelect",
			name: "userColorSelect",
			parent: this.mainContainer,
			style: {
				color: defaultColor
			},
			events: {
				change: (e: Event) => { this.onSelectChange(e); }
			}
		});

		this.prevColor = defaultColor;

		if(this.disabled) this.objectContainer.setAttribute("disabled", "disabled");

		for(const color of ColorSelect.colors){
			this.addOption(color);
		}

		(this.objectContainer as HTMLSelectElement).value = defaultColor;
		const changeEv = new Event("change");
		this.objectContainer.dispatchEvent(changeEv);
	}

	private addOption(color: string){
		createElement("option", {
			textContent: "■■■■■■■■■",
			style: { color },
			attr: { "value": color },
			parent: this.objectContainer
		});
	}

	private onSelectChange(e: Event){
		const newColor: string = (this.objectContainer as HTMLSelectElement).value;
		this.objectContainer.style.color = newColor;

		// Disable all other options with the same color

		const hslNewColor = Color.hexToHSL(newColor);
		hslNewColor.l /= 2;

		const darkerNewColor = Color.hslToHSLString(hslNewColor);

		for(const el of Array.from(document.getElementsByName(this.objectContainer.getAttribute("name")))){
			const previouslyDisabled: HTMLElement = el.querySelector(`option[value="${this.prevColor}"]`);
			const toBeDisabled: HTMLElement = el.querySelector(`option[value="${newColor}"]`);

			previouslyDisabled.removeAttribute("disabled");
			toBeDisabled.setAttribute("disabled", "disabled");

			previouslyDisabled.style.color = this.prevColor;
			toBeDisabled.style.color = darkerNewColor;
		}

		if(e.isTrusted) this.events.emit("ColorChange", newColor);

		this.prevColor = newColor;
	}

	static updateDisabledColors(){
		for(const el of Array.from(document.getElementsByName("userColorSelect"))){
			const color = (el as HTMLSelectElement).value;

			const colorHSL = Color.hexToHSL(color);
			colorHSL.l /= 2;
			const darkenedColor = Color.hslToHSLString(colorHSL);

			for(const opt of Array.from(document.querySelectorAll(`select option[value="${color}"]`))){
				opt.setAttribute("disabled", "disabled");
				(opt as HTMLElement).style.color = darkenedColor;
			}
		}
	}
}
