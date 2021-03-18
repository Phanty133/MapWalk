interface ElementAttributes{
	class?: string,
	id?: string,
	name?: string,
	value?: string,
	parent?: HTMLElement,
	textContent?: string,
	attr?: Record<string, string>,
	events?: Record<string, (e: Event) => void>,
	style?: Record<string, string>
}

export default function createElement(tag: string, options?: ElementAttributes): HTMLElement{ // Just a shorthand for creating elements
	const el = document.createElement(tag);

	if(options.class) el.className = options.class;
	if(options.id) el.id = options.id;
	if(options.parent) options.parent.appendChild(el);
	if(options.textContent) el.textContent = options.textContent;
	if(options.name) el.setAttribute("name", options.name);
	if(options.value) (el as HTMLInputElement).value = options.value;

	if(options.attr) {
		// tslint:disable-next-line: forin
		for(const attr in options.attr){
			el.setAttribute(attr, options.attr[attr]);
		}
	}

	if(options.events){
		// tslint:disable-next-line: forin
		for(const event in options.events){
			el.addEventListener(event, (e: Event) => { options.events[event](e); });
		}
	}

	if(options.style){
		// tslint:disable-next-line: forin
		for(const style in options.style){
			(el.style as any)[style] = options.style[style];
		}
	}

	return el;
}
