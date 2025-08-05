const onvif = require('node-onvif');

async function connect (ip_address, {user="admin", pass="admin123"})
{
    // Create an OnvifDevice object
    let onvifDevice = new onvif.OnvifDevice({
        xaddr: `http://${ip_address}:5000/onvif/device_service`,
        user : user,
        pass : pass,
    });

    try {
        console.log(onvifDevice);

        // Initialize the OnvifDevice object
        const url = await onvifDevice.init().then(() => {
            // Get the UDP stream URL
            console.log(ip_address);
            return onvifDevice.getUdpStreamUrl();
        }).catch((error) => {
            console.error(error);
        });
    
        return url;
    } catch (error) {
        console.error(error);
    }
}

module.exports = {connect}