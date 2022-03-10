"use strict"

document.addEventListener('DOMContentLoaded', init);

async function init() {
  console.log('DOMContentLoaded');
	const videoElement = document.querySelector('div#local video');
	const constrains = {
		'video': true,
		'audio': true
	}

	navigator.mediaDevices.getUserMedia(constrains)
	.then(stream => {
		window.stream = videoElement.srcObject = stream;
		console.log('Got MediaStream:', stream)
	})
	.catch(error => {
		console.log('Error accessing media devices.', error)
	})

	// 查询媒体设备
	function getConnectedDevices(type, callback) {
		navigator.mediaDevices.enumerateDevices()
		.then(devices => {
			const filterd = devices.filter(device => device.kind === type);
			callback(filterd)
		})
	}

	getConnectedDevices('videoinput', cameras => {
		console.log('Cameras found ', cameras)
	})


	const createPeerConnectionButton = document.querySelector('button#createPeerConnection');

	createPeerConnectionButton.onclick = createPeerConnection;


	let localPeerConnection;
	let remotePeerConnection;
	let localStream;

	function createLocalPeerConnection(servers) {
		// 本地端
		window.localPeerConnection = localPeerConnection = new RTCPeerConnection(servers);
		console.log('Created local peer connection object localPeerConnection');
		// Listen for local ICE candidates on the local RTCPeerConnection
		localPeerConnection.onicecandidate = e => {
			// onIceCandidate(localPeerConnection, e)
			try {
			// eslint-disable-next-line no-unused-vars
			const ignore = remotePeerConnection.addIceCandidate(e.candidate);
			console.log('AddIceCandidate success.');
			} catch (e) {
			console.log(`Failed to add Ice Candidate: ${e.toString()}`);
			}
			/* send
			if (event.candidate) {
				signalingChannel.send({'new-ice-candidate': event.candidate});
			}*/

			console.log(`localPeerConnection ICE candidate:\n${e.candidate ? e.candidate.candidate : '(null)'}`);
		};
		//sendChannel = localPeerConnection.createDataChannel('sendDataChannel', dataChannelOptions);
		//sendChannel.onopen = onSendChannelStateChange;
		//sendChannel.onclose = onSendChannelStateChange;
		//sendChannel.onerror = onSendChannelStateChange;
	}
	
	function createRemotePeerConnection(servers) {
		// 远程端
		window.remotePeerConnection = remotePeerConnection = new RTCPeerConnection(servers);
		console.log('Created remote peer connection object remotePeerConnection');
		// Listen for remote ICE candidates on the remote RTCPeerConnection
		remotePeerConnection.onicecandidate = e => {
			// onIceCandidate(remotePeerConnection, e)
			try {
			// eslint-disable-next-line no-unused-vars
			const ignore = localPeerConnection.addIceCandidate(e.candidate);
			console.log('AddIceCandidate success.');
			} catch (e) {
			console.log(`Failed to add Ice Candidate: ${e.toString()}`);
			}
			/* send
			if (event.candidate) {
				signalingChannel.send({'new-ice-candidate': event.candidate});
			}*/

			console.log(`remotePeerConnection ICE candidate:\n${e.candidate ? e.candidate.candidate : '(null)'}`);
		}; 
		//remotePeerConnection.ontrack = gotRemoteStream;
		//remotePeerConnection.ondatachannel = receiveChannelCallback;
	}

	function createPeerConnection() {
		console.log('Starting call');
    localStream = window.stream
		const videoTracks = localStream.getVideoTracks();
		const audioTracks = localStream.getAudioTracks();

		const servers = null;
		createLocalPeerConnection(servers);
		createRemotePeerConnection(servers);

		localStream.getTracks()
			.forEach(track => localPeerConnection.addTrack(track, localStream));
		console.log('Adding Local Stream to peer connection');
	}
}