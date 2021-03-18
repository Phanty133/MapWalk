import DynamicElement from "../DynamicElement";
import createElement from "ts/lib/createElement";
import ColorSelect from "./ColorSelect";
import Log from "ts/lib/log";

export interface User{
	username: string;
	isHost: boolean;
	socketID?: string;
	isSelf: boolean;
}

export default class LobbyUsers extends DynamicElement{
	users: User[] = [];
	selfIsHost: boolean = false;

	constructor(containerSelector: string | HTMLElement){
		super(containerSelector);

		this.createBase();
	}

	protected createBase(){
		this.objectContainer = createElement("div", { id: "p2pUsers", parent: this.mainContainer });

		this.addUser({
			username: "User1",
			isHost: true,
			isSelf: true,
			socketID: "0"
		});

		this.addUser({
			username: "User2",
			isHost: false,
			isSelf: false,
			socketID: "1"
		});

		this.addUser({
			username: "User3",
			isHost: false,
			isSelf: false,
			socketID: "2"
		});

		this.addUser({
			username: "User4",
			isHost: false,
			isSelf: false,
			socketID: "2"
		});

		this.addUser({
			username: "User5",
			isHost: false,
			isSelf: false,
			socketID: "2"
		});

		this.addUser({
			username: "User6",
			isHost: false,
			isSelf: false,
			socketID: "2"
		});

		this.addUser({
			username: "User7",
			isHost: false,
			isSelf: false,
			socketID: "2"
		});

		this.addUser({
			username: "User8",
			isHost: false,
			isSelf: false,
			socketID: "2"
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

		if(this.selfIsHost){
			this.addHostButtons(user, userContainer);
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

			if(this.selfIsHost){
				this.addHostButtons(user, this.findContainerWithUser(user));
			}
			else{
				const kickBtn = container.querySelector("button[data-kick]");
				const hostBtn = container.querySelector("button[data-hostbtn]");

				if(kickBtn) kickBtn.remove();
				if(hostBtn) hostBtn.remove();
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
		const socketId = (e.target as HTMLElement).parentElement.getAttribute("data-socket");

		Log.log("set host: " + socketId);
	}

	private kickPlayerHandler(e: Event){
		const socketId = (e.target as HTMLElement).parentElement.getAttribute("data-socket");

		Log.log("kick: " + socketId);
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
}
