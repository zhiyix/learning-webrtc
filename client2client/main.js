"use strict"

document.addEventListener('DOMContentLoaded', init);

async function init() {
  console.log('DOMContentLoaded');
  const localVideo = document.querySelector('div#local video');
  const remoteVideo = document.querySelector('div#remote video');

  const constrains = {
    'video': true,
    'audio': true
  }

  navigator.mediaDevices.getUserMedia(constrains)
    .then(stream => {
      window.stream = localVideo.srcObject = stream;
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
    remotePeerConnection.ontrack = e => {
      if (remoteVideo.srcObject !== e.streams[0]) {
        remoteVideo.srcObject = e.streams[0];
        console.log('Received remote stream');
      }
    };
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

    try {
      // eslint-disable-next-line no-unused-vars
      const ignore = await remotePeerConnection.setRemoteDescription(offer);
      console.log('Set session description success.');
    } catch (e) {
      // onSetSessionDescriptionError(e);
      console.log(`Failed to set session description: ${e.toString()}`);
      return;
    }
  }

  const createAnswerButton = document.querySelector('button#createAnswer');
  const answerSdpTextarea = document.querySelector('div#remote textarea');
  createAnswerButton.onclick = createAnswer;

  async function createAnswer() {
    // Since the 'remote' side has no media stream we need
    // to pass in the right constraints in order for it to
    // accept the incoming offer of audio and video.
    try {
      const answer = await remotePeerConnection.createAnswer();
      answerSdpTextarea.value = answer.sdp;
    } catch (e) {
      onCreateSessionDescriptionError(e);
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
      const ignore = await remotePeerConnection.setLocalDescription(answer);
      console.log('Set session description success.');
    } catch (e) {
      console.log(`Failed to set session description: ${e.toString()}`);
      return;
    }

    console.log(`Modified Answer from remotePeerConnection\n${sdp}`);
    try {
      // eslint-disable-next-line no-unused-vars
      const ignore = await localPeerConnection.setRemoteDescription(answer);
      console.log('Set session description success.');
    } catch (e) {
      console.log(`Failed to set session description: ${e.toString()}`);
      return;
    }
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
    remotePeerConnection.close();
    localPeerConnection = null;
    remotePeerConnection = null;
  }
}