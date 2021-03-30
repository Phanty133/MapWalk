import { EventEmitter } from "events";

export default class Clock{
	private static startTime: number = 480; // How many minutes to append to the curTime

	curTime: number = 0; // Cur game time in minutes
	private timeEl: HTMLSpanElement;
	events: EventEmitter = new EventEmitter();

	public get timeString(): string{
		const offsetTime = this.curTime + Clock.startTime;
		const dayTime = offsetTime % 1440;
		const hours = Math.floor(dayTime / 60);
		const min = dayTime % 60;

		return this.timeStringFromTime(hours, min);
	}

	public get timeStringSinceStart(): string{
		const hours = Math.floor(this.curTime / 60);
		const min = this.curTime % 60;

		return this.timeStringFromTime(hours, min);
	}

	public get dayTime(): number{
		return this.curTime % 1440;
	}

	constructor(){
		this.timeEl = document.getElementById("gameTime");
		this.updateTimeEl();
	}

	private timeStringFromTime(hrs: number, min: number){
		const hrsStr = hrs.toString();
		const minStr = min.toString();

		return `${hrsStr.length === 1 ? `0${hrsStr}` : hrsStr}:${minStr.length === 1 ? `0${minStr}` : minStr}`;
	}

	addTime(n: number){ // Add minutes
		const prevTime = this.curTime;

		this.curTime += Math.floor(n);
		this.updateTimeEl();

		if(prevTime % 1440 > prevTime % 1440){ // New day
			this.events.emit("NewDay");
		}
	}

	private updateTimeEl(){
		this.timeEl.textContent = this.timeString;
	}
}
