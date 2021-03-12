function createElement(tag, options = {}){ // Just a shorthand for creating elements
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
			el.addEventListener(event, options.events[event]);
		}
	}

	if(options.style){
		for(const style in options.style){
			el.style[style] = options.style[style];
		}
	}

	return el;
}

function createSelect(parent, optionArr){ // Just a shorthand for creating select elements
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
