import Log from "ts/lib/log";

export default class MenuManager{
	private container: HTMLElement;
	private curMenu: string;
	private menus: Record<string, HTMLElement> = {};

	constructor(container: HTMLElement, defaultMenu: string){
		this.container = container;
		this.curMenu = defaultMenu;

		this.bindMenus();
		this.bindEvents();

		this.menus[defaultMenu].style.display = "grid";
	}

	private bindMenus(){
		const menus: HTMLElement[] = Array.from(this.container.querySelectorAll("[data-menu]"));

		for(const menu of menus){
			this.menus[menu.getAttribute("data-menu")] = menu;
		}
	}

	private bindEvents(){
		for(const btn of Array.from(this.container.querySelectorAll("button[data-goto]"))){
			btn.addEventListener("click", () => {
				this.setMenu(btn.getAttribute("data-goto"));
			});
		}
	}

	setMenu(id: string){
		this.menus[this.curMenu].style.display = "none"; // Hide the previous menu

		this.curMenu = id;
		this.menus[this.curMenu].style.display = "grid";
	}
}