import Log from "./log";

export function randInt(min: number, max: number): number{
	return Math.floor(Math.random() * (max - min) + min);
}

export function genHexString(len: number): string{
	return [...new Array(len)].map(e => randInt(0, 16).toString(16)).join("");
}

export function uint8ToHex(uint8: Uint8Array){
	return Array.from(uint8).map(int8 => int8.toString(16).slice(-1)).join("");
}

export async function getHashString(data: any): Promise<string>{
	const dataBlob = new Blob(data);
	const digest = await crypto.subtle.digest("SHA-1", new Uint8Array(await dataBlob.arrayBuffer()));
	return uint8ToHex(new Uint8Array(digest));
}
