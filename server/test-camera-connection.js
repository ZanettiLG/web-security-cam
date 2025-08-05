const { spawn } = require('child_process');

// Camera configurations from your logs
const cameras = [
    {
        id: 1,
        name: 'Front Camera',
        ip: '192.168.3.30',
        username: 'admin',
        password: 'C@z@p321',
        channel: '/cam/realmonitor?channel=1&subtype=0'
    },
    {
        id: 2,
        name: 'Quarto Bibi',
        ip: '192.168.3.31',
        username: 'admin',
        password: 'Cazape1248',
        channel: '/onvif1'
    }
];

// Common RTSP URL patterns to test
const commonPaths = [
    '/cam/realmonitor?channel=1&subtype=0', // Hikvision/Dahua style
    '/onvif1', // ONVIF style
    '/live/ch0', // Generic live stream
    '/live/ch00_0', // Another common pattern
    '/live/av0', // Another common pattern
    '/live', // Simple live
    '/stream1', // Stream 1
    '/stream2', // Stream 2
    '/h264Preview_01_main', // Hikvision main stream
    '/h264Preview_01_sub', // Hikvision sub stream
    '/live/ch1', // Channel 1
    '/live/ch2', // Channel 2
    '/cam/realmonitor?channel=1&subtype=1', // Sub stream
    '/cam/realmonitor?channel=1&subtype=2', // Another subtype
];

async function testCamera(camera) {
    console.log(`\n=== Testing Camera: ${camera.name} (${camera.ip}) ===`);
    
    const baseUrl = `rtsp://${camera.username}:${camera.password}@${camera.ip}:554`;
    const urlsToTest = [
        `${baseUrl}${camera.channel}`, // Original URL
        ...commonPaths.map(path => `${baseUrl}${path}`)
    ];

    for (let i = 0; i < urlsToTest.length; i++) {
        const url = urlsToTest[i];
        console.log(`\nTesting URL ${i + 1}/${urlsToTest.length}: ${url}`);
        
        const result = await testUrl(url);
        if (result.success) {
            console.log(`✅ SUCCESS: ${url}`);
            return { camera: camera.name, workingUrl: url };
        } else {
            console.log(`❌ FAILED: ${result.error}`);
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return { camera: camera.name, workingUrl: null };
}

async function testUrl(url) {
    return new Promise((resolve) => {
        const testProcess = spawn('ffmpeg', [
            '-nostdin',
            '-rtsp_transport', 'tcp',
            '-i', url,
            '-t', '3',  // Test for 3 seconds
            '-f', 'null',
            '-'
        ]);

        let errorOutput = '';
        let success = false;

        testProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        testProcess.on('close', (code) => {
            if (code === 0) {
                success = true;
            }
        });

        // Wait for 8 seconds max
        setTimeout(() => {
            if (!success) {
                testProcess.kill('SIGTERM');
            }
        }, 8000);

        testProcess.on('close', () => {
            resolve({
                success,
                error: errorOutput.substring(0, 200) // Limit error output
            });
        });
    });
}

async function main() {
    console.log('🔍 Camera Connection Test Tool');
    console.log('==============================\n');
    
    const results = [];
    
    for (const camera of cameras) {
        const result = await testCamera(camera);
        results.push(result);
    }
    
    console.log('\n📊 SUMMARY');
    console.log('==========');
    
    for (const result of results) {
        if (result.workingUrl) {
            console.log(`✅ ${result.camera}: ${result.workingUrl}`);
        } else {
            console.log(`❌ ${result.camera}: No working URL found`);
        }
    }
    
    console.log('\n💡 RECOMMENDATIONS');
    console.log('==================');
    
    for (const result of results) {
        if (!result.workingUrl) {
            console.log(`\nFor ${result.camera}:`);
            console.log('1. Check if the camera is powered on and connected to the network');
            console.log('2. Verify the IP address is correct');
            console.log('3. Check username and password');
            console.log('4. Try accessing the camera web interface');
            console.log('5. Check if the camera supports RTSP streaming');
            console.log('6. Verify firewall settings');
        }
    }
}

// Run the test
main().catch(console.error); 