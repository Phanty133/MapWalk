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

type StartGameCallback = (settings: GameSettings) => void;

export default class SettingsSelection{
	private gameModeSelection: GameModeSelection;
	private objectSelection: ObjectSelection;
	private locationSelection: LocationSelection;
	private containerSelector: string;
	private container: HTMLElement;
	private mode: string;
	onStart: StartGameCallback = () => {};

	constructor(containerSelector = "#settingsSelection", noMisc = false){
		this.mode = (new URLSearchParams(window.location.search)).get("mode");
		this.containerSelector = containerSelector;
		this.container = document.querySelector(containerSelector);
		this.container.style.display = "none";

		this.createElements(noMisc);
	}

	open(){
		this.container.style.display = "grid";
	}

	close(){
		this.container.style.display = "none";
	}

	private createElements(noMisc: boolean = false){
		if(!noMisc) this.createTitle();

		this.gameModeSelection = new GameModeSelection(this.containerSelector);
		this.locationSelection = new LocationSelection(this.containerSelector);
		this.objectSelection = new ObjectSelection(this.containerSelector);

		if(!noMisc) this.createStartGameButton();
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

	getSettings(): GameSettings{
		return {
			mode: this.mode,
			gamemode: this.gameModeSelection.value,
			location: this.locationSelection.value,
			objectCount: this.objectSelection.value
		};
	}
}