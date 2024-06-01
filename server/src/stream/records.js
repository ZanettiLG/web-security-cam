const fs = require('fs');
const { spawn } = require('child_process');

// Função para gravar stream RTSP em MP4
async function start(streamUrl, outputFilePath)
{
  if (fs.existsSync(outputFilePath)) {
    console.error('O arquivo de saída já existe:', outputFilePath);
    return;
  }

  fs.closeSync(fs.openSync(outputFilePath, 'w'));

  const ffmpegProcess = spawn('ffmpeg', [
    '-nostdin',
    '-rtsp_transport', 'tcp',
    '-i', streamUrl,
    '-c:v', 'copy',
    '-an',
    '-f', 'mp4',
    outputFilePath,
  ]);

  // Redireciona a saída do ffmpeg para o arquivo
  ffmpegProcess.stdout.pipe(fs.createWriteStream(outputFilePath));

  ffmpegProcess.on('error', (err) => {
    console.error('Error occurred during recording:', err);
  });

  ffmpegProcess.on('close', (code) => {
    console.log('Recording process exited with code', code);
  });
}

module.exports = {start}