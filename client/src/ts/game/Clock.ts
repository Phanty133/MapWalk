export default class Clock{
	private static startTime: number = 480; // How many minutes to append to the curTime

	private curTime: number = 0; // Cur game time in minutes
	private timeEl: HTMLSpanElement;

	public get timeString(): string{
		const offsetTime = this.curTime + Clock.startTime;
		const dayTime = offsetTime % 1440;
		const hours: string = (Math.floor(dayTime / 60)).toString();
		const min: string = (dayTime % 60).toString();

		return `${hours.length === 1 ? `0${hours}` : hours}:${min.length === 1 ? `0${min}` : min}`;
	}

	constructor(){
		this.timeEl = document.getElementById("gameTime");
		this.updateTimeEl();
	}

	addTime(n: number){ // Add minutes
		this.curTime += Math.floor(n);
		this.updateTimeEl();
	}

	private updateTimeEl(){
		this.timeEl.textContent = this.timeString;
	}
}
