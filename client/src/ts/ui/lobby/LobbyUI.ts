import Log from "ts/lib/log";
import Socket, { PlayerData, ServerLobbyColorChangeData, ServerLobbyJoinedData, ServerLobbyKickData, ServerLobbyMakeHostData, ServerLobbySettingsChangedData, ServerLobbyUserDisconnectedData } from "ts/networking/Socket";
import SettingsSelection, { GameSettings } from "ts/ui/settingsUI/SettingsSelection";
import LobbyChat from "./LobbyChat";
import LobbyUsers from "./LobbyUsers";

export default class LobbyUI{
	private containerSelector: string;
	private container: HTMLElement;
	users: LobbyUsers;
	private chat: LobbyChat;
	private settings: SettingsSelection;
	private socket: Socket;
	private lobbyID: string;
	private startGameBtn: HTMLButtonElement;

	constructor(socket: Socket, containerSelector: string = "#p2pLobby"){
		this.containerSelector = containerSelector;
		this.container = document.querySelector(containerSelector);
		this.socket = socket;

		this.bindUIEvents();
	}

	private createBase(){
		this.container.style.display = "grid";

		this.users = new LobbyUsers(this.container, this.socket);
		this.chat = new LobbyChat(this.socket, this.users);
		this.settings = new SettingsSelection("#lobbySettingsSelection", { misc: false, location: false });
		this.settings.onChange = (newSettings: GameSettings) => { this.onSettingsChange(newSettings); };
		this.settings.open();

		document.getElementById("lobbyID").textContent = this.lobbyID;
		document.getElementById("p2pQuitLobby").addEventListener("click", () => { window.location.href = "/"; });

		this.startGameBtn = document.getElementById("p2pStartGame") as HTMLButtonElement;
		this.startGameBtn.disabled = !this.users.selfIsHost;
		this.startGameBtn.addEventListener("click", () => { this.onStartGame(); });
	}

	private bindUIEvents(){
		this.socket.events.addListener("ServerLobbyNewPlayer", (plyrData: PlayerData) => {
			this.chat.addSystemMessage(`${plyrData.username} has joined!`, "#388e3c");
			this.users.addUserFromData(plyrData);
			this.updateStartBtnState();

			// Reload settings, so the new player gets em. Jank, but works
			if(this.users.selfIsHost){
				this.onSettingsChange(this.settings.getSettings());
			}
		});

		this.socket.events.addListener("ServerLobbyJoined", (data: ServerLobbyJoinedData) => {
			this.lobbyID = data.lobbyId;
			this.createBase();

			for(const plyr of data.players){
				this.users.addUserFromData(plyr);
			}

			this.settings.setSettingsDisabled(!this.users.selfIsHost);
			this.updateStartBtnState();
		});

		this.socket.events.addListener("ServerLobbyKicked", () => {
			window.location.href = "/";
		});

		this.socket.events.addListener("ServerLobbyColorChange", (data: ServerLobbyColorChangeData) => {
			this.users.updateColor(data.socketID, data.color);
		});

		this.socket.events.addListener("ServerLobbyKick", (data: ServerLobbyKickData) => {
			this.chat.addSystemMessage(`${this.users.userByID(data.socketID).username} has been kicked!`, "#EE0000");
			this.users.removePlayer(data.socketID);
			this.updateStartBtnState();
		});

		this.socket.events.addListener("ServerLobbyMakeHost", (data: ServerLobbyMakeHostData) => {
			this.chat.addSystemMessage(`${this.users.userByID(data.socketID).username} has been made host!`, "#0288d1");
			this.users.setHost(data.socketID);
			this.settings.setSettingsDisabled(!this.users.selfIsHost);
		});

		this.socket.events.addListener("ServerLobbyUserDisconnected", (data: ServerLobbyUserDisconnectedData) => {
			this.chat.addSystemMessage(`${this.users.userByID(data.socketID).username} has disconnected!`, "#EE0000");
			this.users.removePlayer(data.socketID);
			this.updateStartBtnState();
		});

		this.socket.events.addListener("ServerLobbySettingsChanged", (data: ServerLobbySettingsChangedData) => {
			this.settings.updateSettings(data.settings);
		});
	}

	private updateStartBtnState(){
		if(!this.users.selfIsHost) return;

		this.startGameBtn.disabled = this.users.users.length < 2;
	}

	private onStartGame(){
		if(!this.users.selfIsHost) return;

		this.socket.serverLobbyStartGame(this.settings.getSettings());
	}

	private onSettingsChange(newSettings: GameSettings){
		this.socket.serverLobbySettingsChanged(newSettings);
	}
}
