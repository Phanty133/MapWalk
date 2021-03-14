import Socket from "./Socket";

export interface PeerData{
	peer: string;
	createOffer: boolean;
}

export interface RemoteSessionData{
	peer: string;
	sessionDesc: RTCSessionDescriptionInit;
}

export interface IceCandidate{
	sdpMLineIndex: number;
	candidate: string;
}

export interface IceCandidateData{
	peer: string;
	iceCandidate: IceCandidate;
}

export default class P2PLobby{
	static ICE_SERVERS: any[] = [{"urls": ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"]}, {"urls": "turn:45.9.188.93:5349", "username": "guest", "credential": "somepassword"}];
	peers: Record<string, RTCPeerConnection> = {};
	channels: Record<string, RTCDataChannel> = {};
	socket: Socket;
	joinedLobby: boolean = false;

	constructor(socket: Socket){
		this.socket = socket;
	}

	joinLobby(){
		if(this.joinedLobby) return;

		this.socket.P2PJoinLobby();
	}

	private createDataChannel(con: RTCPeerConnection): Promise<RTCDataChannel>{
		return new Promise<RTCDataChannel>((res, rej) => {
			const channel = con.createDataChannel("data");

			channel.onopen = () => {
				console.log("Channel open");
				P2PLobby.send(channel, { cmd: "init", id: this.socket.id });
				res(channel);
			};

			channel.onclose = () => {
				console.log("Channel close");
			};

			channel.onmessage = (e: MessageEvent) => { this.messageHandler(e); };
		});
	}

	async addPeer(data: PeerData){
		if(data.peer in this.peers){
			// tslint:disable-next-line: no-console
			console.warn("Already connected to peer ", data.peer);
			return;
		}

		const peerConnection: RTCPeerConnection = new RTCPeerConnection({ iceServers: P2PLobby.ICE_SERVERS });
		this.peers[data.peer] = peerConnection;

		peerConnection.onicecandidate = (e) => {
			if(e.candidate){
				this.socket.P2PRelayICECandidate(data.peer, { sdpMLineIndex: e.candidate.sdpMLineIndex, candidate: e.candidate.candidate });
			}
		};

		peerConnection.ontrack = (e) => {
			// tslint:disable-next-line: no-console
			console.log("Connected track ", e);
			// TODO: actually make it do something when connected
		};

		// peerConnection.addTrack();

		if(data.createOffer){
			this.createDataChannel(peerConnection)
				.then((channel: RTCDataChannel) => {
					this.channels[data.peer] = channel;
				});

			// tslint:disable-next-line: no-console
			console.log("Creating an RTC offer to ", data.peer);

			const localDesc = await peerConnection.createOffer();

			await peerConnection.setLocalDescription(localDesc);
			this.socket.P2PRelaySessionDesc(data.peer, localDesc);
		}
		else{
			peerConnection.ondatachannel = (e: RTCDataChannelEvent) => {
				console.log("Data channel received");

				e.channel.onmessage = (e: MessageEvent) => { this.messageHandler(e); };
			};
		}
	}

	iceCandidate(data: IceCandidateData){
		this.peers[data.peer].addIceCandidate(new RTCIceCandidate(data.iceCandidate));
	}

	async remoteSessionDesc(data: RemoteSessionData){
		// tslint:disable-next-line: no-console
		console.log("Remote desc received!");
		const desc = new RTCSessionDescription(data.sessionDesc);
		const peer = this.peers[data.peer];

		await peer.setRemoteDescription(desc);

		// tslint:disable-next-line: no-console
		console.log("setRemoteDescription OK");

		if(data.sessionDesc.type === "offer"){
			const localDesc = await peer.createAnswer();

			await peer.setLocalDescription(localDesc);
			this.socket.P2PRelaySessionDesc(data.peer, localDesc);
		}
	}

	private messageHandler(e: MessageEvent){
		console.log("Received message!");
		console.log(e);

		const args = JSON.parse(e.data);

		switch(args.cmd){
			case "init":
				this.channels[args.id] = e.target as RTCDataChannel;

				console.log(this.channels);
				break;
		}
	}

	static send(channel: RTCDataChannel, data: object){
		channel.send(JSON.stringify(data));
	}

	broadcast(data: object){
		for(const channel of Object.values(this.channels)){
			P2PLobby.send(channel, data);
		}
	}
}
