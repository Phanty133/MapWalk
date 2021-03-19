import Log from "ts/lib/log";

export type FrameUpdateCallback = () => void;

export default class Time{
	static deltaTime: number = 0;
	static timeScale: number = 1;
	static frameCap: number = 90;
	static fixedFrameTime: number = 1000 / Time.frameCap;
	private static frameCallbacks: FrameUpdateCallback[] = [];
	private prevFrameTime: number = 0;

	constructor(){
		this.prevFrameTime = performance.now();
		this.onFrame();
	}

	private onFrame(){
		const curTime: number = performance.now();
		Time.deltaTime = curTime - this.prevFrameTime;

		for(const cb of Time.frameCallbacks){
			cb();
		}

		this.prevFrameTime = curTime;
		setTimeout(() => {
			this.onFrame();
		}, Time.fixedFrameTime * Time.timeScale);
	}

	static bindToFrame(cb: FrameUpdateCallback){
		Time.frameCallbacks.push(cb);
	}
}