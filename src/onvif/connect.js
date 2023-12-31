const onvif = require('node-onvif');

async function connect (ip, {port="5000", user="admin", pass="admin"})
{
    // Create an OnvifDevice object
    let device = new onvif.OnvifDevice({
        xaddr: `http://${ip}:${port}/onvif/device_service`,
        user : user,
        pass : pass
    });
   
    // Initialize the OnvifDevice object
    const url = await device.init().then(() => 
    {
        // Get the UDP stream URL
        return device.getUdpStreamUrl();
    }).catch((error) => {
        console.error(error);
    });

    return url;
}

module.exports = {connect}