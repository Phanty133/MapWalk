export function randInt(min: number, max: number): number{
	return Math.floor(Math.random() * (max - min) + min);
}

export function genHexString(len: number): string{
	return [...new Array(len)].map(e => randInt(0, 16).toString(16)).join("");
}
