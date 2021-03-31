import bgMusic from "audio/bgmusic.wav"

export default class SoundEngine{
	private bgAudio: HTMLAudioElement;
	audioFX: HTMLAudioElement[] = [];

	constructor(){
		this.playBG(bgMusic);
	}

	playBG(src: string, loop: boolean = false){
		this.bgAudio = new Audio(src);
		this.bgAudio.loop = loop;
		this.bgAudio.play();
		this.bgAudio.volume = 0.1;
	}

	playEffect(src: string, loop: boolean = false): number{
		const fxAudio = new Audio(src);
		fxAudio.loop = loop;
		fxAudio.play();

		if(loop){
			this.audioFX.push(fxAudio);
			return this.audioFX.length - 1;
		}

		return -1;
	}

	stopEffect(id: number){
		this.audioFX[id].pause();
		this.audioFX[id].remove();
		this.audioFX.splice(id, 1);
	}
}
