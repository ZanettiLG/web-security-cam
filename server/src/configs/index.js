require('dotenv').config();

const env = {
    IP: process.env.IP,
    USER: process.env.USER,
    PASS: process.env.PASS,
    DATABASE_URL: process.env.DATABASE_URL,
    MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,
    MINIO_PORT: process.env.MINIO_PORT,
    MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY,
    MINIO_USE_SSL: process.env.MINIO_USE_SSL === 'true',
    MINIO_BUCKET_NAME: process.env.MINIO_BUCKET_NAME,
    NODE_ENV: process.env.NODE_ENV || 'development'
};

module.exports = env;