"use strict"

const constrains = {
	'video': true,
	'audio': true
}

navigator.mediaDevices.getUserMedia(constrains)
.then(stream => {
	console.log('Got MediaStream:', stream)
})
.catch(error => {
	console.log('Error accessing media devices.', error)
})

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