const { Pool } = require('pg');
const { DATABASE_URL } = require('../configs/index');

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection
pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Initialize database tables
const initDatabase = async () => {
    try {
        const client = await pool.connect();
        
        // Create recordings table
        await client.query(`
            CREATE TABLE IF NOT EXISTS recordings (
                id SERIAL PRIMARY KEY,
                video_url VARCHAR(500) NOT NULL,
                camera_id INTEGER REFERENCES cameras(id),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                thumbnail_url VARCHAR(500)
            )
        `);

        // Create cameras table
        await client.query(`
            CREATE TABLE IF NOT EXISTS cameras (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255),
                channel VARCHAR(100),
                username VARCHAR(100),
                password VARCHAR(255),
                location VARCHAR(255),
                is_active BOOLEAN DEFAULT true,
                ip_address VARCHAR(45) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_seen TIMESTAMP
            )
        `);

        // Create events table
        await client.query(`
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                camera_id INTEGER REFERENCES cameras(id),
                event_type VARCHAR(50) NOT NULL,
                description TEXT,
                recording_id INTEGER REFERENCES recordings(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                severity VARCHAR(20) DEFAULT 'medium'
            )
        `);

        client.release();
        console.log('Database tables initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
};

module.exports = {
    pool,
    initDatabase
}; 