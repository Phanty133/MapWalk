import SettingsSelection from "ts/ui/settingsUI/SettingsSelection";
import LobbyUsers from "./LobbyUsers";

export default class LobbyUI{
	private containerSelector: string;
	private container: HTMLElement;
	private users: LobbyUsers;
	private settings: SettingsSelection;

	constructor(containerSelector: string = "#p2pLobby"){
		this.containerSelector = containerSelector;
		this.container = document.querySelector(containerSelector);

		this.createBase();
	}

	private createBase(){
		this.container.style.display = "grid";

		this.users = new LobbyUsers(this.container);
		this.settings = new SettingsSelection("#lobbySettingsSelection", true);
		this.settings.open();

		document.getElementById("p2pQuitLobby").addEventListener("click", () => { window.location.href = "/"; })
	}
}
