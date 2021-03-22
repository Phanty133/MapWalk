export default class Clock{
	private static startTime: number = 480; // How many minutes to append to the curTime

	curTime: number = 0; // Cur game time in minutes
	private timeEl: HTMLSpanElement;

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
		this.curTime += Math.floor(n);
		this.updateTimeEl();
	}

	private updateTimeEl(){
		this.timeEl.textContent = this.timeString;
	}
}
