"use strict"


import {
	io
} from "https://cdn.socket.io/4.3.2/socket.io.esm.min.js";
document.addEventListener('DOMContentLoaded', init);

async function init() {
	console.log('DOMContentLoaded');
	const localVideo = document.querySelector('div#local video');
	const remoteVideo = document.querySelector('div#remote video');

	const constrains = {
		'video': true,
		'audio': false
	}

	// 查询媒体设备
	function getConnectedDevices(type, callback) {
		console.log(navigator.mediaDevices)
		navigator.mediaDevices.enumerateDevices()
			.then(devices => {
				const filterd = devices.filter(device => device.kind === type);
				callback(filterd)
			})
	}

	getConnectedDevices('videoinput', cameras => {
		console.log('Cameras found ', cameras)
	})


	let localStream;

	const getMediaButton = document.querySelector('button#getMedia');
	getMediaButton.onclick = getMedia;
	async function getMedia() {
		if (localStream) {
			localVideo.srcObject = null;
			localStream.getTracks().forEach(track => track.stop());
		}

		console.log('Requested local stream');
		try {
			navigator.mediaDevices.getUserMedia(constrains)
				.then(stream => {
					window.stream = localVideo.srcObject = stream;
					localStream = stream;
					console.log('Got MediaStream:', stream)
				})
				.catch(error => {
					console.log('Error accessing media devices.', error)
				})

		} catch (e) {
			console.log('navigator.getUserMedia error: ', e);
		}
	}

	const createPeerConnectionButton = document.querySelector('button#createPeerConnection');
	createPeerConnectionButton.onclick = createPeerConnection;


	let localPeerConnection;

	function createLocalPeerConnection(servers) {
		// 本地端
		window.localPeerConnection = localPeerConnection = new RTCPeerConnection(servers);
		console.log('Created local peer connection object localPeerConnection');
		// Listen for local ICE candidates on the local RTCPeerConnection
		localPeerConnection.onicecandidate = e => {
			// onIceCandidate(localPeerConnection, e)
			// send 
			if (e.candidate) {
				send_message({
					type: 'candidate',
					label: e.candidate.sdpMLineIndex,
					id: e.candidate.sdpMid,
					candidate: e.candidate.candidate
				});
			}

			console.log(
				`localPeerConnection ICE candidate:\n${e.candidate ? e.candidate.candidate : '(null)'}`);
		};
		localPeerConnection.ontrack = e => {
			if (remoteVideo.srcObject !== e.streams[0]) {
				remoteVideo.srcObject = e.streams[0];
				console.log('Received remote stream');
			}
		};
		//sendChannel = localPeerConnection.createDataChannel('sendDataChannel', dataChannelOptions);
		//sendChannel.onopen = onSendChannelStateChange;
		//sendChannel.onclose = onSendChannelStateChange;
		//sendChannel.onerror = onSendChannelStateChange;
	}

	function createPeerConnection() {
		console.log('Starting call');
		localStream = window.stream
		const videoTracks = localStream.getVideoTracks();
		const audioTracks = localStream.getAudioTracks();

		const servers = null;
		createLocalPeerConnection(servers);

		localStream.getTracks()
			.forEach(track => localPeerConnection.addTrack(track, localStream));
		console.log('Adding Local Stream to peer connection');
	}

	const createOfferButton = document.querySelector('button#createOffer');
	const offerSdpTextarea = document.querySelector('div#local textarea');
	createOfferButton.onclick = createOffer;

	const offerOptions = {
		offerToReceiveAudio: 1,
		offerToReceiveVideo: 1
	};

	async function createOffer() {
		try {
			const offer = await localPeerConnection.createOffer(offerOptions);
			offerSdpTextarea.value = offer.sdp;
		} catch (e) {
			// onCreateSessionDescriptionError(e);
			console.log(`Failed to set session description: ${e.toString()}`);
		}
	}

	const setOfferButton = document.querySelector('button#setOffer');
	setOfferButton.onclick = setOffer;

	async function setOffer() {
		// Restore the SDP from the textarea. Ensure we use CRLF which is what is generated
		// even though https://tools.ietf.org/html/rfc4566#section-5 requires
		// parsers to handle both LF and CRLF.
		const sdp = offerSdpTextarea.value
			.split('\n')
			.map(l => l.trim())
			.join('\r\n');
		const offer = {
			type: 'offer',
			sdp: sdp
		};
		console.log(`Modified Offer from localPeerConnection\n${sdp}`);

		try {
			// eslint-disable-next-line no-unused-vars
			const ignore = await localPeerConnection.setLocalDescription(offer);
			console.log('Set session description success.');
		} catch (e) {
			// onSetSessionDescriptionError(e);
			console.log(`Failed to set session description: ${e.toString()}`);
			return;
		}

		send_message(offer);
	}

	const createAnswerButton = document.querySelector('button#createAnswer');
	const answerSdpTextarea = document.querySelector('div#remote textarea');
	createAnswerButton.onclick = createAnswer;

	async function createAnswer() {
		// Since the 'remote' side has no media stream we need
		// to pass in the right constraints in order for it to
		// accept the incoming offer of audio and video.
		try {
			const answer = await localPeerConnection.createAnswer();
			answerSdpTextarea.value = answer.sdp;
		} catch (e) {
			console.log(`Failed to create session description: ${e.toString()}`);
  	}
	}

	const setAnswerButton = document.querySelector('button#setAnswer');
	setAnswerButton.onclick = setAnswer;

	async function setAnswer() {
		// Restore the SDP from the textarea. Ensure we use CRLF which is what is generated
		// even though https://tools.ietf.org/html/rfc4566#section-5 requires
		// parsers to handle both LF and CRLF.
		const sdp = answerSdpTextarea.value
			.split('\n')
			.map(l => l.trim())
			.join('\r\n');
		const answer = {
			type: 'answer',
			sdp: sdp
		};

		try {
			// eslint-disable-next-line no-unused-vars
			const ignore = await localPeerConnection.setLocalDescription(answer);
			console.log('Set session description success.');
		} catch (e) {
			console.log(`Failed to set session description: ${e.toString()}`);
			return;
		}
		send_message(answer);
	}

	const hangupButton = document.querySelector('button#hangup');
	hangupButton.onclick = hangup;

	function hangup() {
		remoteVideo.srcObject = null;
		console.log('Ending call');
		localStream.getTracks().forEach(track => track.stop());
		//sendChannel.close();
		/*
		if (receiveChannel) {
			receiveChannel.close();
		}*/
		localPeerConnection.close();
		localPeerConnection = null;
	}

	let socket = io('http://127.0.0.1:3030');

	let interval = setInterval(() => {
		socket.emit('random', Math.random());
	}, 8000);

	socket.on('warn', count => {
		console.log('warning count : ' + count);
	});

	socket.on('disconnect', () => {
		clearInterval(interval);
	});

	socket.on('message', data => {
		console.log('receive message: ', data)

		if (data === null || data === undefined) {
			console.log('message invalid')
			return
		}

		if (data.hasOwnProperty('type') && data.type === 'offer') {
			try {
				// eslint-disable-next-line no-unused-vars
				const ignore = localPeerConnection.setRemoteDescription(new RTCSessionDescription(data));
				console.log('Set session description success.');
			} catch (e) {
				// onSetSessionDescriptionError(e);
				console.log(`Failed to set session description: ${e.toString()}`);
				return;
			}
		}
		else if (data.hasOwnProperty('type') && data.type === 'answer') {
			console.log(`Modified Answer from remotePeerConnection\n${data}`);
			try {
				// eslint-disable-next-line no-unused-vars
				const ignore = localPeerConnection.setRemoteDescription(new RTCSessionDescription(data));
				console.log('Set session description success.');
			} catch (e) {
				console.log(`Failed to set session description: ${e.toString()}`);
				return;
			}
		}
		else if (data.hasOwnProperty('type') && data.type === 'candidate') {
			try {
				// eslint-disable-next-line no-unused-vars
				var candidate = new RTCIceCandidate({
					sdpMLineIndex: data.label,
					candidate: data.candidate
				});
				localPeerConnection.addIceCandidate(candidate);
				console.log('AddIceCandidate success.');
			} catch (e) {
				console.log(`Failed to add Ice Candidate: ${data.toString()}`);
			}
		} else {
			console.log('message is invalid!', data);
		}
	});


	function send_message(data) {
		console.log('Send message to end, ', data)
		if (!socket) {
			console.log('socket is invalid!')
		}
		socket.emit('message', data)
	}
}
