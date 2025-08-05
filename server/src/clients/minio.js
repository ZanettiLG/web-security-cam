const Minio = require('minio');
const { 
    MINIO_ENDPOINT, 
    MINIO_PORT, 
    MINIO_ACCESS_KEY, 
    MINIO_SECRET_KEY, 
    MINIO_USE_SSL,
} = require('../configs/index');

const minioClient = new Minio.Client({
    endPoint: MINIO_ENDPOINT,
    port: parseInt(MINIO_PORT),
    useSSL: MINIO_USE_SSL,
    accessKey: MINIO_ACCESS_KEY,
    secretKey: MINIO_SECRET_KEY
});

// Initialize MinIO buckets
const initMinio = async () => {
    try {
        // Check if buckets exist, create if they don't
        const buckets = ['recordings', 'thumbnails'];
        
        for (const bucketName of buckets) {
            const exists = await minioClient.bucketExists(bucketName);
            if (!exists) {
                await minioClient.makeBucket(bucketName);
                console.log(`Bucket '${bucketName}' created successfully`);
                
                // Set bucket policy to public read
                const policy = {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: { AWS: ['*'] },
                            Action: ['s3:GetObject'],
                            Resource: [`arn:aws:s3:::${bucketName}/*`]
                        }
                    ]
                };
                
                await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
                console.log(`Public read policy set for bucket '${bucketName}'`);
            }
        }
        
        console.log('MinIO initialized successfully');
    } catch (error) {
        console.error('Error initializing MinIO:', error);
        throw error;
    }
};

// Upload file to MinIO
const uploadFile = async (bucketName, objectName, filePath, contentType = 'application/octet-stream') => {
    try {
        const metaData = {
            'Content-Type': contentType
        };
        await minioClient.fPutObject(bucketName, objectName, filePath, metaData);
        return `http://${MINIO_ENDPOINT}:${MINIO_PORT}/${bucketName}/${objectName}`;
    } catch (error) {
        console.error('Error uploading file to MinIO:', error);
        throw error;
    }
};

// Get file URL
const getFileUrl = (bucketName, objectName) => {
    return `http://${MINIO_ENDPOINT}:${MINIO_PORT}/${bucketName}/${objectName}`;
};

// Delete file from MinIO
const deleteFile = async (bucketName, objectName) => {
    try {
        await minioClient.removeObject(bucketName, objectName);
        console.log(`File ${objectName} deleted from bucket ${bucketName}`);
    } catch (error) {
        console.error('Error deleting file from MinIO:', error);
        throw error;
    }
};

module.exports = {
    minioClient,
    initMinio,
    uploadFile,
    getFileUrl,
    deleteFile
}; 