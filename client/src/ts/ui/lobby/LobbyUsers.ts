import DynamicElement from "../DynamicElement";
import createElement from "ts/lib/createElement";
import ColorSelect from "./ColorSelect";
import Log from "ts/lib/log";
import * as Cookies from "js-cookie";
import Socket, { PlayerData } from "ts/networking/Socket";

export interface User{
	username: string;
	isHost: boolean;
	socketID?: string;
	isSelf: boolean;
}

export default class LobbyUsers extends DynamicElement{
	users: User[] = [];
	selfIsHost: boolean = false;
	socket: Socket;

	constructor(containerSelector: string | HTMLElement, socket: Socket){
		super(containerSelector);
		this.socket = socket;

		this.createBase();
	}

	protected createBase(){
		this.objectContainer = createElement("div", { id: "p2pUsers", parent: this.mainContainer });
	}

	public addUserFromData(userData: PlayerData){
		this.addUser({
			username: userData.username,
			socketID: userData.socketID,
			isSelf: userData.socketID === this.socket.id,
			isHost: userData.isHost
		});
	}

	public addUser(user: User){
		this.users.push(user);
		if(user.isSelf) this.selfIsHost = user.isHost;

		const userContainer = createElement("div", {
			class: "p2pUserEntry",
			parent: this.objectContainer,
			attr: {
				"data-socket": user.socketID
			}
		});

		createElement("span", { textContent: user.username, parent: userContainer, attr: { "data-username": "data-username" } });

		if(user.isHost){
			createElement("span", { textContent: "Host", parent: userContainer, attr: { "data-host": "data-host" } });
		}

		const colorSelect = new ColorSelect(userContainer, !user.isSelf, this.firstAvailableColor());
		colorSelect.el.setAttribute("data-color", "data-color");

		colorSelect.events.on("ColorChange", (newColor: string) => {
			this.socket.serverLobbyChangeColor(newColor);
		});

		if(this.selfIsHost){
			// this.addHostButtons(user, userContainer);
			this.updateHostButtons();
		}

		ColorSelect.updateDisabledColors();
	}

	private addHostButtons(user: User, userContainer: HTMLElement){
		if(user.isHost) return;

		if(!userContainer.querySelector("button[data-kick]")){
			createElement("button", {
				textContent: "Kick",
				class: "button",
				parent: userContainer,
				attr: { "data-kick": "data-kick" },
				events: {
					click: (e: Event) => { this.kickPlayerHandler(e); }
				}
			});
		}

		if(!userContainer.querySelector("button[data-hostbtn]")){
			createElement("button", {
				textContent: "Make host",
				class: "button",
				parent: userContainer,
				attr: { "data-hostbtn": "data-hostbtn" },
				events: {
					click: (e: Event) => { this.setHostHandler(e); }
				}
			});
		}
	}

	private updateHostButtons(){
		for(const user of this.users){
			const container = this.findContainerWithUser(user);
			const startGameBtn = document.getElementById("p2pStartGame") as HTMLButtonElement;

			if(this.selfIsHost){
				this.addHostButtons(user, this.findContainerWithUser(user));
				startGameBtn.disabled = false;
			}
			else{
				const kickBtn = container.querySelector("button[data-kick]");
				const hostBtn = container.querySelector("button[data-hostbtn]");

				if(kickBtn) kickBtn.remove();
				if(hostBtn) hostBtn.remove();
				startGameBtn.disabled = true;
			}
		}
	}

	private findContainerWithUser(user: User): HTMLDivElement{
		return this.objectContainer.querySelector(`.p2pUserEntry[data-socket="${user.socketID}`);
	}

	private firstAvailableColor(){
		const availableColors: string[] = [...ColorSelect.colors];

		for(const el of Array.from(document.getElementsByName("userColorSelect"))){
			const index = availableColors.findIndex(c => c === (el as HTMLSelectElement).value);
			availableColors.splice(index, 1);
		}

		return availableColors[0];
	}

	private setHostHandler(e: Event){
		if(!this.selfIsHost) return;

		const socketId = (e.target as HTMLElement).parentElement.getAttribute("data-socket");
		this.socket.serverLobbyMakeHost(socketId);
	}

	private kickPlayerHandler(e: Event){
		if(!this.selfIsHost) return;

		const socketId = (e.target as HTMLElement).parentElement.getAttribute("data-socket");
		this.socket.serverLobbyKick(socketId);
	}

	getPlayerElement(id: string): HTMLDivElement{
		return this.objectContainer.querySelector(`.p2pUserEntry[data-socket="${id}`);
	}

	setHost(id: string){
		const prevHost = this.users.find(user => user.isHost);
		const newHost = this.users.find(user => user.socketID === id);

		prevHost.isHost = false;
		newHost.isHost = true;

		this.findContainerWithUser(prevHost).querySelector("[data-host]").remove();

		const newHostContainer: HTMLElement = this.findContainerWithUser(newHost);
		createElement("span", { textContent: "Host", parent: newHostContainer, attr: { "data-host": "data-host" } });

		if(prevHost.isSelf || newHost.isSelf){
			if(prevHost.isSelf){
				this.selfIsHost = false;
			}
			else{
				this.selfIsHost = true;
			}

			this.updateHostButtons();
		}
	}

	kickPlayer(id: string){
		this.getPlayerElement(id).remove();
		ColorSelect.updateDisabledColors();
	}

	updateColor(id: string, color: string){
		const el = this.getPlayerElement(id);
		const selectEl = el.querySelector("[data-color]") as HTMLSelectElement;

		selectEl.value = color;

		const changeEv = new Event("change");
		selectEl.dispatchEvent(changeEv);
	}
}
