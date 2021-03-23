import Log from "ts/lib/log";
import Socket, { PlayerData, ServerLobbyChatMessageData, ServerLobbyColorChangeData, ServerLobbyJoinedData, ServerLobbyKickData, ServerLobbyMakeHostData } from "ts/networking/Socket";
import SettingsSelection from "ts/ui/settingsUI/SettingsSelection";
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
		this.settings = new SettingsSelection("#lobbySettingsSelection", true);
		this.settings.open();

		document.getElementById("lobbyID").textContent = this.lobbyID;
		document.getElementById("p2pQuitLobby").addEventListener("click", () => { window.location.href = "/"; });

		const startGameBtn = document.getElementById("p2pStartGame") as HTMLButtonElement;
		startGameBtn.disabled = !this.users.selfIsHost;
		startGameBtn.addEventListener("click", () => { this.onStartGame(); });
	}

	private bindUIEvents(){
		this.socket.events.addListener("ServerLobbyNewPlayer", (plyrData: PlayerData) => {
			this.users.addUserFromData(plyrData);
		});

		this.socket.events.addListener("ServerLobbyJoined", (data: ServerLobbyJoinedData) => {
			this.lobbyID = data.lobbyId;
			this.createBase();

			for(const plyr of data.players){
				this.users.addUserFromData(plyr);
			}
		});

		this.socket.events.addListener("ServerLobbyKicked", () => {
			window.location.href = "/";
		});

		this.socket.events.addListener("ServerLobbyColorChange", (data: ServerLobbyColorChangeData) => {
			this.users.updateColor(data.socketID, data.color);
		});

		this.socket.events.addListener("ServerLobbyKick", (data: ServerLobbyKickData) => {
			this.users.kickPlayer(data.socketID);
		});

		this.socket.events.addListener("ServerLobbyMakeHost", (data: ServerLobbyMakeHostData) => {
			this.users.setHost(data.socketID);
		});
	}

	private onStartGame(){
		if(!this.users.selfIsHost) return;

		this.socket.serverLobbyStartGame(this.settings.getSettings());
	}
}
