const { pool } = require('../../clients/database');
const { 
  RequiredError, 
  NotFoundError,
} = require('../../utils/error');

// Get all recordings
async function getRecordings() {
  const { rows } = await pool.query(`
    SELECT r.*, c.name as camera_name, c.location 
    FROM recordings r 
    LEFT JOIN cameras c ON r.camera_id = c.id 
    ORDER BY r.timestamp DESC
  `);
  return rows;
}

// Get recording by ID
async function getRecordingById(id) {
  if (!id) {
    throw new RequiredError('ID is required');
  }

  const { rows } = await pool.query(`
    SELECT r.*, c.name as camera_name, c.location 
    FROM recordings r 
    LEFT JOIN cameras c ON r.camera_id = c.id 
    WHERE r.id = $1
  `, [id]);

  if (rows.length === 0) {
    throw new NotFoundError('Recording not found');
  }

  return rows[0];
}

// Get recordings by camera ID
async function getRecordingsByCamera(cameraId) {
  if (!cameraId) {
    throw new RequiredError('Camera ID is required');
  }

  const { rows } = await pool.query(`
    SELECT r.*, c.name as camera_name, c.location 
    FROM recordings r 
    LEFT JOIN cameras c ON r.camera_id = c.id 
    WHERE r.camera_id = $1 
    ORDER BY r.timestamp ASC
    LIMIT 1
  `, [cameraId]);

  return rows;
}

// Create new recording
async function createRecording(recording) {
  const { video_url, camera_id, thumbnail_url } = recording;

  if (!video_url) {
    throw new RequiredError('Video URL is required');
  }

  if (!camera_id) {
    throw new RequiredError('Camera ID is required');
  }

  // Verify if camera exists
  const cameraExists = await pool.query('SELECT id FROM cameras WHERE id = $1', [camera_id]);
  if (cameraExists.rows.length === 0) {
    throw new NotFoundError('Camera not found');
  }

  const { rows } = await pool.query(`
    INSERT INTO recordings (video_url, camera_id, timestamp, thumbnail_url)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [video_url, camera_id, new Date(), thumbnail_url || null]);

  return rows[0];
}

// Update recording
async function updateRecording(id, recording) {
  if (!id) {
    throw new RequiredError('ID is required');
  }

  const existingRecording = await pool.query('SELECT id FROM recordings WHERE id = $1', [id]);
  if (existingRecording.rows.length === 0) {
    throw new NotFoundError('Recording not found');
  }

  const { video_url, camera_id, thumbnail_url } = recording;
  const updateFields = [];
  const values = [];
  let paramCount = 1;

  if (video_url !== undefined) {
    updateFields.push(`video_url = $${paramCount}`);
    values.push(video_url);
    paramCount++;
  }

  if (camera_id !== undefined) {
    // Verify if camera exists
    const cameraExists = await pool.query('SELECT id FROM cameras WHERE id = $1', [camera_id]);
    if (cameraExists.rows.length === 0) {
      throw new NotFoundError('Camera not found');
    }
    updateFields.push(`camera_id = $${paramCount}`);
    values.push(camera_id);
    paramCount++;
  }

  if (thumbnail_url !== undefined) {
    updateFields.push(`thumbnail_url = $${paramCount}`);
    values.push(thumbnail_url);
    paramCount++;
  }

  if (updateFields.length === 0) {
    throw new RequiredError('At least one field must be provided for update');
  }

  values.push(id);
  const { rows } = await pool.query(`
    UPDATE recordings 
    SET ${updateFields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `, values);

  return rows[0];
}

// Delete recording
async function deleteRecording(id) {
  if (!id) {
    throw new RequiredError('ID is required');
  }

  const existingRecording = await pool.query('SELECT id FROM recordings WHERE id = $1', [id]);
  if (existingRecording.rows.length === 0) {
    throw new NotFoundError('Recording not found');
  }

  const { rows } = await pool.query('DELETE FROM recordings WHERE id = $1 RETURNING *', [id]);
  return rows[0];
}

// Get recordings by date range
async function getRecordingsByDateRange(startDate, endDate, cameraId = null) {
  if (!startDate || !endDate) {
    throw new RequiredError('Start date and end date are required');
  }

  let query = `
    SELECT r.*, c.name as camera_name, c.location 
    FROM recordings r 
    LEFT JOIN cameras c ON r.camera_id = c.id 
    WHERE r.timestamp BETWEEN $1 AND $2
  `;
  let values = [startDate, endDate];

  if (cameraId) {
    query += ' AND r.camera_id = $3';
    values.push(cameraId);
  }

  query += ' ORDER BY r.timestamp DESC';

  const { rows } = await pool.query(query, values);
  return rows;
}

// Get recordings count by camera
async function getRecordingsCountByCamera() {
  const { rows } = await pool.query(`
    SELECT 
      c.id,
      c.name as camera_name,
      c.location,
      COUNT(r.id) as recordings_count
    FROM cameras c
    LEFT JOIN recordings r ON c.id = r.camera_id
    GROUP BY c.id, c.name, c.location
    ORDER BY recordings_count DESC
  `);
  return rows;
}

module.exports = {
  getRecordings,
  getRecordingById,
  getRecordingsByCamera,
  createRecording,
  updateRecording,
  deleteRecording,
  getRecordingsByDateRange,
  getRecordingsCountByCamera,
};
