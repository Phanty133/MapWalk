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

export function removeFromArray<T>(arr: T[], func: (el: T, i: number) => boolean): T{
	for(let i = 0; i < arr.length; i++){
		if(func(arr[i], i)) {
			arr.splice(i, 1);
			return;
		}
	}
}
