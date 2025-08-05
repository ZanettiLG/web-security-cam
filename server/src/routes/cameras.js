const express = require('express');
const router = express.Router();
const { pool } = require('../clients/database');
const { Cameras, Recordings } = require('../services');

// Get all cameras
router.get('/', async (req, res) => {
    try {
        const cameras = await Cameras.getCameras();
        res.json(cameras);
    } catch (error) {
        console.error('Error fetching cameras:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get camera by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const camera = await Cameras.getCameraById(id);
        res.json(camera);
    } catch (error) {
        console.error('Error fetching camera:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add new camera
router.post('/', async (req, res) => {
    try {
        const camera = await Cameras.createCamera(req.body);
        res.status(201).json(camera);
    } catch (error) {
        console.error('Error adding camera:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update camera
router.put('/:id', async (req, res) => {
    try {
        const camera = await Cameras.updateCamera(req.params.id, req.body);
        res.json(camera);
    } catch (error) {
        console.error('Error updating camera:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete camera
router.delete('/:id', async (req, res) => {
    try {
        const camera = await Cameras.deleteCamera(req.params.id);
        res.json(camera);
    } catch (error) {
        console.error('Error deleting camera:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id/recordings', async (req, res) => {
    try {
        const recordings = await Recordings.getRecordingsByCamera(req.params.id);
        res.json(recordings);
    } catch (error) {
        console.error('Error fetching recordings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update camera last seen
router.patch('/:id/last-seen', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { rows } = await pool.query(`
            UPDATE cameras 
            SET last_seen = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Camera not found' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Error updating camera last seen:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update camera channel/URL
router.patch('/:id/channel', async (req, res) => {
    try {
        const { id } = req.params;
        const { channel } = req.body;
        
        if (!channel) {
            return res.status(400).json({ error: 'Channel is required' });
        }

        const { rows } = await pool.query(`
            UPDATE cameras 
            SET channel = $1
            WHERE id = $2
            RETURNING *
        `, [channel, id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Camera not found' });
        }
        
        res.json({
            message: 'Camera channel updated successfully',
            camera: rows[0],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error updating camera channel:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Test alternative RTSP URLs for camera
router.post('/:id/test-alternatives', async (req, res) => {
    try {
        const { id } = req.params;
        const camera = await Cameras.getCameraById(id);
        
        if (!camera) {
            return res.status(404).json({ error: 'Camera not found' });
        }

        const { getAlternativeRtspUrls } = require('../clients/rtsp');
        const alternativeUrls = getAlternativeRtspUrls({
            ip_address: camera.ip_address,
            username: camera.username,
            password: camera.password,
            port: 554,
            channel: camera.channel
        });

        const results = [];
        const { spawn } = require('child_process');

        for (let i = 0; i < alternativeUrls.length; i++) {
            const url = alternativeUrls[i];
            console.log(`Testing URL ${i + 1}/${alternativeUrls.length}: ${url}`);
            
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

            // Wait for 8 seconds max per URL
            await new Promise((resolve) => {
                setTimeout(() => {
                    if (!success) {
                        testProcess.kill('SIGTERM');
                    }
                    resolve();
                }, 8000);

                testProcess.on('close', resolve);
            });

            results.push({
                url: url,
                success: success,
                errorOutput: errorOutput.substring(0, 500), // Limit error output
                index: i
            });

            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        res.json({
            camera: camera,
            results: results,
            workingUrls: results.filter(r => r.success).map(r => r.url),
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error testing alternative URLs:', error);
        res.status(500).json({ error: error.message });
    }
});

// List active recording streams
router.get('/streams/active', async (req, res) => {
    try {
        const { listActiveStreams } = require('../clients/rtsp');
        const activeStreams = listActiveStreams();
        
        res.json({
            activeStreams: activeStreams,
            count: activeStreams.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error listing active streams:', error);
        res.status(500).json({ error: error.message });
    }
});

// Restart camera recording
router.post('/:id/restart', async (req, res) => {
    try {
        const { id } = req.params;
        const camera = await Cameras.getCameraById(id);
        
        if (!camera) {
            return res.status(404).json({ error: 'Camera not found' });
        }

        // Stop existing stream if running
        const { stopRtspStream } = require('../clients/rtsp');
        const sessionId = `camera_${String(id).padStart(3, '0')}`;
        stopRtspStream(sessionId);

        // Wait a moment for cleanup
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Start new stream
        const stream = await Cameras.startStream(camera);

        res.json({
            message: `Camera ${camera.name} recording restarted`,
            camera: camera,
            sessionId: sessionId,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error restarting camera:', error);
        res.status(500).json({ error: error.message });
    }
});

// Test camera connectivity
router.post('/:id/test', async (req, res) => {
    try {
        const { id } = req.params;
        const camera = await Cameras.getCameraById(id);
        
        if (!camera) {
            return res.status(404).json({ error: 'Camera not found' });
        }

        const { getRtspUrl } = require('../clients/rtsp');
        const rtspUrl = getRtspUrl({
            ip_address: camera.ip_address,
            username: camera.username,
            password: camera.password,
            port: 554,
            channel: camera.channel
        });

        // Test connection with a short timeout
        const { spawn } = require('child_process');
        const testProcess = spawn('ffmpeg', [
            '-nostdin',
            '-rtsp_transport', 'tcp',
            '-i', rtspUrl,
            '-t', '5',  // Test for 5 seconds
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

        // Wait for 10 seconds max
        setTimeout(() => {
            if (!success) {
                testProcess.kill('SIGTERM');
            }
        }, 10000);

        // Wait for process to complete
        await new Promise((resolve) => {
            testProcess.on('close', resolve);
        });

        res.json({
            camera: camera,
            rtspUrl: rtspUrl,
            success: success,
            errorOutput: errorOutput,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error testing camera:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get camera statistics
router.get('/:id/stats', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get camera info
        const cameraResult = await pool.query('SELECT * FROM cameras WHERE id = $1', [id]);
        if (cameraResult.rows.length === 0) {
            return res.status(404).json({ error: 'Camera not found' });
        }
        
        const camera = cameraResult.rows[0];
        
        // Get recordings count
        const recordingsResult = await pool.query(`
            SELECT COUNT(*) as total_recordings,
                   SUM(file_size) as total_size,
                   COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as recordings_24h
            FROM recordings 
            WHERE camera_ip = $1
        `, [camera.ip_address]);
        
        // Get events count
        const eventsResult = await pool.query(`
            SELECT COUNT(*) as total_events,
                   COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as events_24h
            FROM events 
            WHERE camera_id = $1
        `, [id]);
        
        const stats = {
            camera: camera,
            recordings: recordingsResult.rows[0],
            events: eventsResult.rows[0]
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Error fetching camera stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 