interface ElementAttributes{
	class: string,
	id: string,
	parent: HTMLElement,
	textContent: string,
	attr: Record<string, string>,
	events: Record<string, Function>,
	style: Record<string, Function>
}

function createElement(tag: string, options?: ElementAttributes){ // Just a shorthand for creating elements
	const el = document.createElement(tag);

	if(options.class) el.className = options.class;
	if(options.id) el.id = options.id;
	if(options.parent) options.parent.appendChild(el);
	if(options.textContent) el.textContent = options.textContent;

	if(options.attr) {
		for(const attr in options.attr){
			el.setAttribute(attr, options.attr[attr]);
		}
	}

	if(options.events){
		for(const event in options.events){
			el.addEventListener(event, (e: Event) => { options.events[event].call(e) });
		}
	}

	if(options.style){
		for(const style in options.style){
			(<any>el.style)[style] = options.style[style];
		}
	}

	return el;
}

interface Option{
	text: string;
	value?: string;
}

function createSelect(parent: HTMLElement, optionArr: Option[]){ // Just a shorthand for creating select elements
	let selEl;
	
	if(parent.tagName.toLowerCase() === "select"){
		selEl = parent;
	}
	else{
		selEl = document.createElement("select");
		parent.appendChild(selEl);
	}

	for(const opt of optionArr){
		const optEl = document.createElement("option");
		optEl.textContent = opt.text;
		optEl.value = opt.value ? opt.value : opt.text;
		selEl.appendChild(optEl);
	}

	return selEl;
}
