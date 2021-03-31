import createElement from "ts/lib/createElement";
import Log from "ts/lib/log";
import MathExtras from "ts/lib/MathExtras";
import P2PLobby from "ts/networking/P2PLobby";
import Game from "../game/Game";
import { EventEmitter } from "events";

interface ForeignStream{
	peer: string,
	el: HTMLAudioElement,
	stream: MediaStream
}

export default class VoiceChat{
	localStream: MediaStream;
	foreignStreams: Record<string, ForeignStream> = {}; // peerID : foreingStream
	events: EventEmitter = new EventEmitter();
	audioConnected: boolean = false;

	private p2p: P2PLobby;
	private unitsForFullVolume = 0.0025;
	private muteThreshold = 0.1;

	constructor(p2p: P2PLobby){
		this.p2p = p2p;
	}

	async requestMedia(){
		try{
			this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
		}
		catch(err){
			// tslint:disable-next-line: no-console
			console.warn(err);
		}
	}

	async connectToPeer(peer: string, peerConnection: RTCPeerConnection){
		Log.log("voice peer: " + peer);

		peerConnection.ontrack = (e) => {
			Log.log("track receive");

			const remoteStream = new MediaStream();
			remoteStream.addTrack(e.track);

			this.addForeignAudioStream(peer, remoteStream);

			if(Object.keys(this.foreignStreams).length === Object.keys(this.p2p.peers).length){
				this.audioConnected = true;
				this.events.emit("AudioConnected");
			}
		};

		peerConnection.addTrack(this.localStream.getTracks()[0], this.localStream);
	}

	private addForeignAudioStream(peer: string, stream: MediaStream){
		const mediaEl = createElement("audio", { attr: { autoplay: "autoplay", controls: "" }, parent: document.body }) as HTMLAudioElement;
		mediaEl.srcObject = stream;
		mediaEl.volume = 0;

		this.foreignStreams[peer] = {peer, el: mediaEl, stream}
	}

	updateVolume(peer: string, distance: number){
		const vol = MathExtras.clamp(this.unitsForFullVolume / distance, 0, 1) ** 2;

		if(vol <= this.muteThreshold){
			this.foreignStreams[peer].el.volume = 0;
		}
		else{
			this.foreignStreams[peer].el.volume = vol;
		}

		Log.log("DISTANCE: " + distance);
		Log.log("VOLUME: " + vol);
	}
}
