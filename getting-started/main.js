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