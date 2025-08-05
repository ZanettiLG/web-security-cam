const fs = require('fs');
const path = require('path');
const { uuid, isFunction } = require('../utils');
const { spawn } = require('child_process');
const { minioClient } = require('./minio');
const { connect } = require('../onvif');

// Track active streams
const activeStreams = new Map();

// Function to generate thumbnail from video
async function generateThumbnail(videoPath, thumbnailPath) {
  return new Promise((resolve, reject) => {
    const ffmpegThumbnail = spawn('ffmpeg', [
      '-i', videoPath,
      '-ss', '00:00:01',  // Take frame at 1 second
      '-vframes', '1',    // Extract only 1 frame
      '-q:v', '2',        // High quality
      '-y',               // Overwrite output
      thumbnailPath
    ]);

    ffmpegThumbnail.on('close', (code) => {
      if (code === 0) {
        resolve(thumbnailPath);
      } else {
        reject(new Error(`FFmpeg thumbnail generation failed with code ${code}`));
      }
    });

    ffmpegThumbnail.on('error', (err) => {
      reject(err);
    });
  });
}

function getRecordsDir() {
  const recordsDir = path.join(__dirname, "../../records");
  if (!fs.existsSync(recordsDir)) {
    fs.mkdirSync(recordsDir, { recursive: true });
  }
  return recordsDir;
}

async function getRtspUrl({ip_address, username="admin", password="admin123", port=554, channel}) {
  if(!channel) {
    const onvif = await connect(ip_address, {user: username, pass: password});
    return onvif;
  }
  return `rtsp://${username}:${password}@${ip_address}:${port}${channel || ""}`;
}

// Function to get alternative RTSP URLs for testing
function getAlternativeRtspUrls({ip_address, username="admin", password="admin123", port=554, channel}) {
  const baseUrl = `rtsp://${username}:${password}@${ip_address}:${port}`;
  
  const commonPaths = [
    channel || "", // Original channel
    "/cam/realmonitor?channel=1&subtype=0", // Hikvision/Dahua style
    "/onvif1", // ONVIF style
    "/live/ch0", // Generic live stream
    "/live/ch00_0", // Another common pattern
    "/live/av0", // Another common pattern
    "/live", // Simple live
    "/stream1", // Stream 1
    "/stream2", // Stream 2
    "/h264Preview_01_main", // Hikvision main stream
    "/h264Preview_01_sub", // Hikvision sub stream
    "/live/ch1", // Channel 1
    "/live/ch2", // Channel 2
  ];
  
  return commonPaths.map(path => `${baseUrl}${path}`);
}

function startRtspStream(streamUrl, {
  sessionId = uuid(),
  onError,
  onClose,
  onNewSegment,
  retryCount = 0,
  maxRetries = 3,
}) {
  console.log(`Iniciando gravação (${sessionId}) - Tentativa ${retryCount + 1}/${maxRetries + 1}`);
  console.log(`URL: ${streamUrl}`);
  
  let currentSegment = 0;
  let lastTimestamp = Date.now();
  const outputPattern = path.join(getRecordsDir(), `${sessionId}_%03d.mp4`);

  const ffmpegProcess = spawn('ffmpeg', [
    '-nostdin',
    '-rtsp_transport', 'udp',
    '-i', streamUrl,
    '-c:v', 'libx264',        // Codifica vídeo em H.264
    '-crf', '23',             // Qualidade constante (0-51, menor = melhor)
    '-c:a', 'aac',            // Codifica áudio em AAC
    '-f', 'segment',          // Usa segmentação
    '-segment_time', '5',     // 5 segundos por segmento
    '-reset_timestamps', '1', // Reseta timestamps para cada segmento
    '-segment_format', 'mp4', // Formato de saída MP4
    '-avoid_negative_ts', 'make_zero', // Evita timestamps negativos
    '-y',                     // Sobrescreve arquivos se existirem
    outputPattern
  ]);

  // Store the process for potential stopping
  activeStreams.set(sessionId, ffmpegProcess);

  // Log da saída do ffmpeg
  ffmpegProcess.stderr.on('data', async (data) => {
    const output = data.toString();
    // Detecta quando um novo segmento é criado
    if (output.includes('Opening') && output.includes('.mp4')) {
      //console.log('Novo segmento criado');
      if(isFunction(onNewSegment) && currentSegment > 0) {
        // Usar o nome real do arquivo criado pelo FFmpeg
        const actualFileName = `${sessionId}_${String(currentSegment - 1).padStart(3, '0')}.mp4`;
        const outputFile = path.join(getRecordsDir(), actualFileName);
        
        // Gerar thumbnail
        const thumbnailFileName = `${sessionId}_${String(currentSegment - 1).padStart(3, '0')}_thumb.jpg`;
        const thumbnailPath = path.join(getRecordsDir(), thumbnailFileName);
        
        try {
          await generateThumbnail(outputFile, thumbnailPath);
          onNewSegment(outputFile, sessionId, actualFileName, lastTimestamp, thumbnailPath);
        } catch (error) {
          console.error('Erro ao gerar thumbnail:', error);
          onNewSegment(outputFile, sessionId, actualFileName, lastTimestamp, null);
        }
      }
      currentSegment++;
      lastTimestamp = Date.now();
    }
  });

  ffmpegProcess.on('error', (err) => {
    console.error('Erro durante a gravação:', err);
    activeStreams.delete(sessionId);
    if(isFunction(onError)) {
      onError(err);
    }
  });

  ffmpegProcess.on('close', (code) => {
    //console.log(`Processo de gravação (${sessionId}) finalizado com código: ${code}`);
    activeStreams.delete(sessionId);
    
    if (code === 0) {
      //console.log(`Gravação (${sessionId}) concluída com sucesso!`);
    } else {
      console.log(`Gravação (${sessionId}) falhou. Verifique a URL da câmera e credenciais.`);
      
      // Retry logic for connection issues
      if (retryCount < maxRetries && (code === 3199971767 || code === 1)) {
        //console.log(`Tentando reconectar em 5 segundos... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          startRtspStream(streamUrl, {
            sessionId,
            onError,
            onClose,
            onNewSegment,
            retryCount: retryCount + 1,
            maxRetries
          });
        }, 5000);
      }
    }
    
    if(isFunction(onClose)) {
      onClose(code);
    }
  });

  return;
}

// Function to stop a specific RTSP stream
function stopRtspStream(sessionId) {
  const process = activeStreams.get(sessionId);
  if (process) {
    console.log(`Stopping RTSP stream: ${sessionId}`);
    process.kill('SIGTERM');
    activeStreams.delete(sessionId);
    return true;
  }
  console.log(`RTSP stream not found: ${sessionId}`);
  return false;
}

// Function to stop all RTSP streams
function stopAllRtspStreams() {
  console.log('Stopping all RTSP streams...');
  for (const [sessionId, process] of activeStreams) {
    process.kill('SIGTERM');
  }
  activeStreams.clear();
}

// Function to list active streams
function listActiveStreams() {
  const active = [];
  for (const [sessionId, process] of activeStreams) {
    active.push({
      sessionId,
      pid: process.pid,
      killed: process.killed
    });
  }
  return active;
}

module.exports = {
  getRtspUrl,
  getAlternativeRtspUrls,
  startRtspStream,
  stopRtspStream,
  stopAllRtspStreams,
  listActiveStreams,
  generateThumbnail,
};