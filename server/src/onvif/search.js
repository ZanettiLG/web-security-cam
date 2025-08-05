const onvif = require('node-onvif');

var devices = {};

async function search() {
	devices = {};
	let names = {};
	await onvif.startProbe().then((device_list) => {
    console.log("DEVICE_LIST", device_list);
		device_list.forEach((device) => {
			let odevice = new onvif.OnvifDevice({
				xaddr: device.xaddrs[0]
			});
			let addr = odevice.address;
			devices[addr] = odevice;
			names[addr] = device.name;
		});
		var devs = {};
		for(var addr in devices) {
			devs[addr] = {
				name: names[addr],
				address: addr
			}
		}

		return devs;
	}).catch((error) => {
		return error;
	});
  return devices;
}

module.exports = {
	search
}