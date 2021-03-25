import { GameMode } from "ts/game/Game";
import Log from "ts/lib/log";
import GameModeSelection from "./GameModeSelection";
import LocationSelection, { Location } from "./LocationSelection";
import ObjectSelection from "./ObjectSelection";

export interface GameSettings{
	mode: string;
	gamemode: GameMode;
	location: Location;
	objectCount: number;
	timeLimit?: number;
}

export interface SettingsConfig{
	misc?:boolean;
	gamemode?:boolean;
	location?:boolean;
	objectCount?:boolean;
}

type StartGameCallback = (settings: GameSettings) => void;
type SettingsChangeCallback = (settings: GameSettings) => void;

export default class SettingsSelection{
	private gameModeSelection: GameModeSelection;
	private objectSelection: ObjectSelection;
	private locationSelection: LocationSelection;
	private containerSelector: string;
	private container: HTMLElement;
	private mode: string;
	onStart: StartGameCallback = () => {};
	onChange: SettingsChangeCallback = () => {};

	constructor(containerSelector = "#settingsSelection", config?: SettingsConfig){
		this.mode = (new URLSearchParams(window.location.search)).get("mode");
		this.containerSelector = containerSelector;
		this.container = document.querySelector(containerSelector);
		this.container.style.display = "none";

		this.createElements(config || {});
	}

	open(){
		this.container.style.display = "grid";
	}

	close(){
		this.container.style.display = "none";
	}

	private createElements(config: SettingsConfig){
		if(config.misc || config.misc === undefined) this.createTitle();

		if(config.gamemode || config.gamemode === undefined) {
			this.gameModeSelection = new GameModeSelection(this.containerSelector);
			this.gameModeSelection.onSelect = () => { this.onChange(this.getSettings()) };
		}

		if(config.location || config.location === undefined) {
			this.locationSelection = new LocationSelection(this.containerSelector);
			this.locationSelection.onSelect = () => { this.onChange(this.getSettings()) };
		}

		if(config.objectCount || config.objectCount === undefined) {
			this.objectSelection = new ObjectSelection(this.containerSelector);
			this.objectSelection.onChange = () => { this.onChange(this.getSettings()) };
		}

		if(config.misc || config.misc === undefined) this.createStartGameButton();
	}

	private createTitle(){
		const title = document.createElement("h2");
		title.textContent = this.mode === "mp" ? "Multiplayer" : "Singleplayer";
		this.container.appendChild(title);
	}

	private createStartGameButton(){
		const btn = document.createElement("button");
		btn.setAttribute("data-startgame", "data-startgame");
		btn.textContent = "Start game";
		btn.className = "button";
		btn.addEventListener("click", () => { this.onStart(this.getSettings()); });
		this.container.appendChild(btn);
	}

	setSettingsDisabled(disabled: boolean = true){
		this.gameModeSelection?.setDisabled(disabled);
		this.locationSelection?.setDisabled(disabled);
		this.objectSelection?.setDisabled(disabled);
	}

	updateSettings(newSettings: GameSettings){
		this.gameModeSelection?.setValue(newSettings.gamemode?.toString());
		this.locationSelection?.setValue(newSettings.location?.toString());
		this.objectSelection?.setValue(newSettings.objectCount);
	}

	getSettings(): GameSettings{
		return {
			mode: this.mode,
			gamemode: this.gameModeSelection?.value,
			location: this.locationSelection?.value,
			objectCount: this.objectSelection?.value
		};
	}
}