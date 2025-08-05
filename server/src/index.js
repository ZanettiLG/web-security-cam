const path = require("path");
const express = require("express");
const cors = require("cors");
// const { provideStream } = require("./stream");
// const { IP, PASS } = require("./configs");
const { initDatabase } = require("./clients/database");
const { initMinio } = require("./clients/minio");
const Cameras = require("./services/cameras");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database and MinIO
const initializeServices = async () => {
    try {
        await initDatabase();
        await initMinio();
        console.log('All services initialized successfully');
    } catch (error) {
        console.error('Error initializing services:', error);
        process.exit(1);
    }
};

// Initialize services before starting the server
initializeServices().then(async () => {
    const getCameras = async () => {
        const cameras = await Cameras.getCameras();
        return cameras;
    };

    const cameras = await getCameras();
    console.log("Cameras:", cameras);

    for (const camera of cameras) {
        const stream = await Cameras.startStream(camera);
        console.log("Stream:", stream);
    }

    // API Routes
    app.use('/api/cameras', require('./routes/cameras'));

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            services: {
                database: 'connected',
                minio: 'connected'
            }
        });
    });

    // Serve static files
    app.use("/static", express.static("./public"));

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/health`);
    });
});