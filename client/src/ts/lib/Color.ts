import Log from "./log";

// tslint:disable-next-line: no-namespace
export namespace Color{
	interface RGB{
		r: number,
		g: number,
		b: number,
		a?: number
	}

	interface HSL{
		h: number,
		s: number,
		l: number,
		a?: number
	}

	export function rgbStringToRGB(color: string): RGB{
		const regexp = /^rgba?\((?<r>\d+), ?(?<g>\d+), ?(?<b>\d+)(, ?(?<a>\d+))?\)$/i;
		const match = color.match(regexp);

		if(!match) return null;

		const colorObj: RGB = {
			r: parseInt(match.groups.r, 10),
			g: parseInt(match.groups.g, 10),
			b: parseInt(match.groups.b, 10)
		};

		if(match.groups.a){
			colorObj.a = parseInt(match.groups.a, 10)
		}

		return colorObj;
	}

	export function rgbToRGBString(color: RGB): string{
		if(color.a){
			return `rgba(${color.r},${color.g},${color.b},${color.a})`;
		}
		else{
			return `rgb(${color.r},${color.g},${color.b})`;
		}
	}

	export function hslStringToHSL(color: string): HSL{
		const regexp = /^hsla?\((?<h>\d+)%, ?(?<s>\d+)%, ?(?<l>\d+)%(, ?(?<a>(0\.)?\d+))?\)$/i;
		const match = color.match(regexp);

		if(!match) return null;

		const colorObj: HSL = {
			h: parseInt(match.groups.h, 10),
			s: parseInt(match.groups.s, 10),
			l: parseInt(match.groups.l, 10)
		};

		if(match.groups.a){
			colorObj.a = parseInt(match.groups.a, 10)
		}

		return colorObj;
	}

	export function hslToHSLString(color: HSL): string{
		if(color.a){
			return `hsla(${color.h},${color.s}%,${color.l}%,${color.a})`;
		}
		else{
			return `hsl(${color.h},${color.s}%,${color.l}%)`;
		}
	}

	export function rgbToHSL(_color: RGB | string): HSL{
		let color: RGB;

		if(typeof(_color) === "string"){
			color = rgbStringToRGB(_color);
		}
		else{
			color = _color;
		}

		// Make r, g, and b fractions of 1
		const r = color.r / 255;
		const g = color.g / 255;
		const b = color.b / 255;

		// Find greatest and smallest channel values
		const cmin = Math.min(r,g,b);
		const cmax = Math.max(r,g,b);
		const delta = cmax - cmin;
		let h = 0;
		let s = 0;
		let l = 0;

		// Calculate hue
		// No difference
		if (delta === 0){
			h = 0;
		}
		else if(cmax === r){
			h = ((g - b) / delta) % 6;
		}
		else if(cmax === g){
			h = (b - r) / delta + 2;
		}
		else{
			h = (r - g) / delta + 4;
		}

		h = Math.round(h * 60);

		// Make negative hues positive behind 360°
		if (h < 0) h += 360;

		// Calculate lightness
		l = (cmax + cmin) / 2;

		// Calculate saturation
		s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

		// Multiply l and s by 100
		s = parseInt((s * 100).toFixed(1), 10);
		l = parseInt((l * 100).toFixed(1), 10);

		return {h, s, l};
	}

	export function hslToRGB(_color: HSL | string): RGB{
		let color: HSL;

		if(typeof(_color) === "string"){
			color = hslStringToHSL(_color);
		}
		else{
			color = _color;
		}

		// Must be fractions of 1
		const s = color.s / 100;
		const l = color.l / 100;
		const h = color.h;

		const c = (1 - Math.abs(2 * l - 1)) * s;
		const x = c * (1 - Math.abs((h / 60) % 2 - 1));
		const m = l - c/2;
		let r = 0;
		let g = 0;
		let b = 0;

		if (0 <= h && h < 60) {
			r = c; g = x; b = 0;
		}
		else if (60 <= h && h < 120) {
			r = x; g = c; b = 0;
		}else if (120 <= h && h < 180) {
			r = 0; g = c; b = x;
		}
		else if (180 <= h && h < 240) {
			r = 0; g = x; b = c;
		}
		else if (240 <= h && h < 300) {
			r = x; g = 0; b = c;
		}
		else if (300 <= h && h < 360) {
			r = c; g = 0; b = x;
		}

		r = Math.round((r + m) * 255);
		g = Math.round((g + m) * 255);
		b = Math.round((b + m) * 255);

		return {r, g, b};
	}

	export function hexToRGB(hex: string): RGB{
		const regexp = /^#?(?<r>[12344567890ABCDEF]{2})(?<g>[12344567890ABCDEF]{2})(?<b>[12344567890ABCDEF]{2})(?<a>[12344567890ABCDEF]{2})?$/i;
		const match = hex.match(regexp);

		const color: RGB = {
			r: parseInt(match.groups.r, 16),
			g: parseInt(match.groups.g, 16),
			b: parseInt(match.groups.b, 16)
		}

		if(match.groups.a) color.a = parseInt(match.groups.a, 16);

		return color;
	}

	export function rgbToHex(rgb: RGB | string): string{
		let color: RGB;

		if(typeof(rgb) === "string"){
			color = rgbStringToRGB(rgb);
		}
		else{
			color = rgb;
		}

		return `#${color.r.toString(16)}${color.g.toString(16)}${color.b.toString(16)}${color.a ? color.a.toString(16) : ""}`;
	}

	export function hslToHex(hsl: HSL | string): string{
		const rgb = hslToRGB(hsl);
		return rgbToHex(rgb);
	}

	export function hexToHSL(hex: string) : HSL{
		const rgb = hexToRGB(hex);
		return rgbToHSL(rgb);
	}
}
