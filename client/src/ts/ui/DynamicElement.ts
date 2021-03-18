export default abstract class DynamicElement{
	protected mainContainer: HTMLElement;
	protected objectContainer: HTMLElement

	constructor(container: string | HTMLElement){
		if(container instanceof HTMLElement){
			this.mainContainer = container;
		}
		else{
			this.mainContainer = document.querySelector(container);
		}
	}

	protected abstract createBase(): void;
}
