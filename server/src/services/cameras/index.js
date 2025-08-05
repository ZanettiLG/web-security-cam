const fs = require('fs');
const { pool } = require('../../clients/database');
const { uploadFile } = require('../../clients/minio');
const { getRtspUrl, startRtspStream } = require('../../clients/rtsp');
const { 
  RequiredError, 
  ConflictError, 
  NotFoundError,
} = require('../../utils/error');

async function getCameras() {
  const cameras = await pool.query('SELECT * FROM cameras');
  return cameras.rows;
}

async function getCameraById(id) {
  if (!id) {
    throw new RequiredError('ID is required');
  }

  const camera = await pool.query('SELECT * FROM cameras WHERE id = $1', [id]);
  if (camera.rows.length === 0) {
    throw new NotFoundError('Camera not found');
  }

  return camera.rows[0];
}

async function createCamera(camera) {
  const { ip_address, username, password, name, location } = camera;
                
  if (!ip_address) {
    throw new RequiredError('IP address is required');
  }
  
  // Check if camera already exists
  const existingCamera = await pool.query('SELECT id FROM cameras WHERE ip_address = $1', [ip_address]);
  if (existingCamera.rows.length > 0) {
    throw new ConflictError('Camera with this IP address already exists');
  }
  
  const { rows } = await pool.query(`
    INSERT INTO cameras (ip_address, username, password, name, location)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [ip_address, username, password, name, location]);

  return rows[0];
}

async function updateCamera(id, camera) {
  if (!id) {
    throw new RequiredError('ID is required');
  }

  const existingCamera = await pool.query('SELECT id FROM cameras WHERE id = $1', [id]);
  if (existingCamera.rows.length === 0) {
    throw new NotFoundError('Camera not found');
  }

  const updatedCamera = await pool.query('UPDATE cameras SET ip_address = $1, username = $2, password = $3, name = $4, location = $5 WHERE id = $6 RETURNING *', [camera.ip_address, camera.username, camera.password, camera.name, camera.location, id]);
  return updatedCamera.rows[0];
}

async function deleteCamera(id) {
  if (!id) {
    throw new RequiredError('ID is required');
  }

  const existingCamera = await pool.query('SELECT id FROM cameras WHERE id = $1', [id]);
  if (existingCamera.rows.length === 0) {
    throw new NotFoundError('Camera not found');
  }

  const deletedCamera = await pool.query('DELETE FROM cameras WHERE id = $1 RETURNING *', [id]);
  return deletedCamera.rows[0];
}

async function startStream(camera) {
  const { id, ip_address, username="admin", password="admin123", port=554, name, location, channel } = camera;
  if (!ip_address) {
    throw new RequiredError('IP address is required');
  }

  const videoUrl = await getRtspUrl({ip_address, username, password, port, channel });
  console.log("videoUrl", videoUrl);

  startRtspStream(
    videoUrl, 
    {
      sessionId: `camera_${String(id).padStart(3, '0')}`,
      onNewSegment: async (outputPattern, sessionId, actualFileName, lastTimestamp, thumbnailPath) => {
        // Verificar se o arquivo existe antes de tentar fazer upload
        if (fs.existsSync(outputPattern)) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
          const segment = `${sessionId}_${timestamp}.mp4`;
          const finalVideoUrl = await uploadFile("recordings", segment, outputPattern);
          //console.log('Final video URL:', finalVideoUrl);
          
          let thumbnailUrl = null;
          if (thumbnailPath && fs.existsSync(thumbnailPath)) {
            const thumbnailSegment = `${sessionId}_${timestamp}_thumb.jpg`;
            thumbnailUrl = await uploadFile("thumbnails", thumbnailSegment, thumbnailPath);
            //console.log('Thumbnail URL:', thumbnailUrl);
          }
          
          // Salvar registro na tabela de gravações
          try {
            await pool.query(`
              INSERT INTO recordings (camera_id, timestamp, video_url, thumbnail_url)
              VALUES ($1, $2, $3, $4)
            `, [id, new Date(), finalVideoUrl, thumbnailUrl]);
            //console.log('Registro salvo na tabela de gravações');
          } catch (error) {
            console.error('Erro ao salvar registro:', error);
          }
          
          // Deletar arquivos locais
          if (fs.existsSync(outputPattern)) {
            fs.unlinkSync(outputPattern);
            //console.log('Arquivo local deletado:', outputPattern);
          }
          
          if (thumbnailPath && fs.existsSync(thumbnailPath)) {
            fs.unlinkSync(thumbnailPath);
            //console.log('Thumbnail local deletado:', thumbnailPath);
          }
        } else {
          console.log('Arquivo não encontrado:', outputPattern);
        }
      },
    }
  );

  return;
}

module.exports = {
    getCameras,
    getCameraById,
    createCamera,
    updateCamera,
    deleteCamera,
    startStream,
};