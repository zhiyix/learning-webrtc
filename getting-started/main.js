"use strict"

const videoElement = document.querySelector('div#local video');
const constrains = {
	'video': true,
	'audio': true
}

navigator.mediaDevices.getUserMedia(constrains)
.then(stream => {
	videoElement.srcObject = stream;
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